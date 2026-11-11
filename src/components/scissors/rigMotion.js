// Renderer-free motion of the shears in CSS px, shared by the 3D rig and the 2D fallback.
import { heroCutPhases } from '../../lib/heroCut.js';
import {
  BURST_DURATION, CUT_FADE, CUT_LINE, CUT_ROLL, DESKTOP_MIN_PX, END_OFFSET, FLOAT, HERO, SWAY, TRACK,
  clamp, cutPose, dockRange, easeFade, idleSnip, lerp, nearAngle, scrollSnip, trackPoint, trackTurn, withBurst,
} from './pose.js';
import { burstElapsed, getScene, rig } from './rig.js';

const TAU = Math.PI * 2;
const POINTER = { max: 8 * (Math.PI / 180), lerp: 0.08, settle: 1e-4 };
const LAG = 8; // 1/s: the shears trail the scroll, as in the reference demo
const LAG_SETTLE = 0.5; // px
const MAX_DT = 0.05;

/**
 * Scroll range of the track in scrollY px. It starts when the shears have docked and ends END_OFFSET
 * viewports before the [data-scissors-end] element scrolls into view, or at the page bottom when there is none.
 * endTop is that element's viewport top (Infinity without one). Pure arithmetic on what useScissorsSignals
 * measured: this runs every frame, and reading the DOM here would force a layout each time.
 */
function readTrack({ heroHeight, cutPin, endTop, pageHeight, viewHeight: viewport }, scrollY) {
  const start = dockRange(heroHeight, cutPin).to;
  const end = endTop === null ? pageHeight - viewport : endTop - viewport * (1 + END_OFFSET);
  return { start, span: Math.max(end - start, 1), endTop: endTop === null ? Infinity : endTop - scrollY };
}

/**
 * Hero pose for a layer of `screen` size: centre and long axis in CSS px, rotation as Euler radians
 * (z = tilt in the screen plane, y = yaw, x = pitch). unit: px per world unit; length: long axis in world units.
 */
export function heroPose(screen, unit, length, time = 0) {
  const hero = screen.width >= DESKTOP_MIN_PX ? HERO.desktop : HERO.mobile;
  return {
    x: screen.width / 2 + hero.x * screen.width,
    y: screen.height / 2 - hero.y * screen.height - FLOAT.amp * unit * Math.sin(TAU * FLOAT.hz * time),
    length: hero.scale * length * unit,
    rotation: { x: 0, y: hero.yaw + SWAY.amp * Math.sin(TAU * SWAY.hz * time), z: hero.tilt },
  };
}

const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) });
const easeInOut = (t) => t * t * (3 - 2 * t);

// Below desktop the About text fills the screen while it shows through the hero cut. Rather than fly across it
// from the end of the cut (left edge) to the track (right edge), the shears fade out early in the dock and fade
// back in at its end, already on the track.
const DOCK_DIP = { out: 0.1, in: 0.92 };
function dockVisibility(dock) {
  const gone = easeInOut(clamp(dock / DOCK_DIP.out, 0, 1));
  const back = easeInOut(clamp((dock - DOCK_DIP.in) / (1 - DOCK_DIP.in), 0, 1));
  return 1 - gone + back;
}
const SCENE_SCALE = 0.8; // a borrowed pair is a little smaller than on the track

// Blends the frame towards a scene that borrowed the shears (rig.setScene): tips on its point, flat to the camera.
function applyScene(frame, scene, trackLength, maxOpen) {
  const w = scene.weight;
  const length = trackLength * SCENE_SCALE;
  const turn = (rotation) => ({ x: 0, y: 0, z: nearAngle(Math.atan2(-scene.dirX, -scene.dirY), rotation.z) });
  frame.x = lerp(frame.x, scene.tipX - (scene.dirX * length) / 2, w);
  frame.y = lerp(frame.y, scene.tipY - (scene.dirY * length) / 2, w);
  frame.length = lerp(frame.length, length, w);
  frame.rotation = mix(frame.rotation, turn(frame.rotation), w);
  frame.heroRotation = mix(frame.heroRotation, turn(frame.heroRotation), w);
  frame.trackRotation = mix(frame.trackRotation, turn(frame.trackRotation), w);
  frame.open = lerp(frame.open, maxOpen * scene.open, w);
  frame.roll = lerp(frame.roll, 0, w);
  frame.paper = lerp(frame.paper, 0, w);
  frame.opacity = Math.max(frame.opacity, w);
}

/**
 * Returns step(input) → frame for one rendered frame. input: { time, dt (s), scrollY, dock (0..1),
 * signals, screen, unit, length, maxOpen }. The frame holds the centre / length in CSS px, the hero and
 * track rotations plus their linear mix, the opening (degrees per half), the opacity and whether
 * another frame is needed. Also publishes visibility and an approximate tip position on `rig`.
 */
export function createRigMotion() {
  const lean = { x: 0, y: 0 };
  let smoothY = null;
  let shown = null; // linear visibility 0..1, eased into the opacity
  let cutAt = null; // performance.now() when the end element crossed CUT_LINE

  return function step({ time, dt: rawDt, scrollY, dock, signals, screen, unit, length, maxOpen }) {
    const dt = Math.min(rawDt, MAX_DT);
    if (smoothY === null || Math.abs(scrollY - smoothY) <= LAG_SETTLE) smoothY = scrollY;
    else smoothY += (scrollY - smoothY) * (1 - Math.exp(-LAG * dt));

    const range = readTrack(signals, scrollY);
    const p = clamp((smoothY - range.start) / range.span, 0, 1);
    const track = screen.width >= DESKTOP_MIN_PX ? TRACK.desktop : TRACK.mobile;
    const point = trackPoint(p, { width: signals.pageWidth, height: screen.height }, signals.gutter, track);

    const k = 1 - (1 - POINTER.lerp) ** (dt * 60); // frame-rate independent lerp
    const leanX = signals.pointer.y * POINTER.max;
    const leanY = signals.pointer.x * POINTER.max;
    lean.x += (leanX - lean.x) * k;
    lean.y += (leanY - lean.y) * k;

    const hero = heroPose(screen, unit, length, time);
    hero.rotation.x += lean.x;
    hero.rotation.y += lean.y;

    // Hero cut: raw scroll (no lag) keeps the tip on the line the hero draws.
    const phases = heroCutPhases(scrollY, signals.cutPin);
    const aim = easeInOut(phases.aim);
    const cut = cutPose(phases.along, signals.pageWidth, signals.heroHeight, maxOpen);
    const before = {
      x: lerp(hero.x, cut.x, aim),
      y: lerp(hero.y, cut.y, aim),
      length: lerp(hero.length, cut.length, aim),
      rotation: mix(hero.rotation, { x: cut.rotation.x + lean.x, y: cut.rotation.y + lean.y, z: cut.rotation.z }, aim),
      open: lerp(idleSnip(time, maxOpen), cut.open, aim),
      roll: CUT_ROLL * aim,
    };

    const turn = trackTurn(p);
    const trackRotation = { x: turn.x + lean.x, y: turn.y + lean.y, z: nearAngle(point.tilt, before.rotation.z) };
    const rotation = mix(before.rotation, trackRotation, dock);
    const burst = burstElapsed();
    const now = performance.now();
    const pastCut = range.endTop < signals.viewHeight * CUT_LINE;
    if (!pastCut) cutAt = null;
    else if (cutAt === null) cutAt = now;
    const holding = pastCut && (now - cutAt) / 1000 < BURST_DURATION; // the final snips play before the fade
    const target = pastCut && !holding ? 0 : 1;
    shown = shown === null ? target : clamp(shown + Math.sign(target - shown) * (dt / CUT_FADE), 0, 1);
    const docking = track === TRACK.mobile ? dockVisibility(dock) : 1;
    const opacity = Math.round(easeFade(shown) * docking * 1000) / 1000;
    const leaning = Math.abs(leanX - lean.x) + Math.abs(leanY - lean.y) > POINTER.settle;

    const frame = {
      x: lerp(before.x, point.x, dock),
      y: lerp(before.y, point.y, dock),
      length: lerp(before.length, track.length, dock),
      dock,
      heroRotation: before.rotation, // the 3D rig slerps from here to the track
      trackRotation,
      rotation,
      open: withBurst(lerp(before.open, scrollSnip(smoothY, screen.height), dock), burst),
      roll: lerp(before.roll, 0, dock), // about the long axis, inside the rotation above (3D only)
      paper: aim * (1 - dock), // 0..1: how much the hero photo acts as a sheet the shears cut through (3D only)
      opacity,
      active: !signals.pageHidden && (signals.heroVisible || leaning || smoothY !== scrollY || burst < BURST_DURATION || holding || shown !== target),
    };

    const scene = getScene();
    if (scene && scene.weight > 0) applyScene(frame, scene, track.length, maxOpen);
    const { rotation: final } = frame;

    const reach = (frame.length / 2) * Math.cos(final.x);
    rig.visible = frame.opacity > 0;
    rig.tipX = frame.x - reach * Math.sin(final.z);
    rig.tipY = frame.y - reach * Math.cos(final.z);
    return frame;
  };
}
