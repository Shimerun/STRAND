// Renderer-free motion of the shears in CSS px, shared by the 3D rig and the 2D fallback.
import { TAU, clamp01, ease, heroCutPhases } from '../../lib/heroCut.js';
import {
  BURST_DURATION, CUT_FADE, CUT_LINE, CUT_ROLL, DESKTOP_MIN_PX, END_OFFSET, FLOAT, HERO, SWAY, TRACK,
  applyScene, cutPose, dockRange, idleSnip, lerp, mix, nearAngle, scrollSnip, trackPoint, trackTurn, withBurst,
} from './pose.js';
import { burstElapsed, getScene, rig } from './rig.js';

const POINTER = { max: 8 * (Math.PI / 180), lerp: 0.08, settle: 1e-4 };
const LAG = 8; // 1/s: the shears trail the scroll, as in the reference demo
const LAG_SETTLE = 0.5; // px
const MAX_DT = 0.05;
// s: an untouched hero floats and snips this long after the last scroll, pointer move or resize, then eases to
// rest over `fade` and stops drawing. Drawn without end, it took a fifth of a phone's main thread.
const IDLE = { after: 8, fade: 1.2 };

/**
 * Scroll range of the track in scrollY px: from the dock to END_OFFSET viewports before the end element scrolls
 * into view (the page bottom without one); endTop is its viewport top (Infinity without one). Pure arithmetic on
 * what useScissorsSignals measured: reading the DOM in this per-frame code would force a layout each time.
 */
function readTrack({ heroHeight, cutPin, endTop, pageHeight, viewHeight: viewport }, scrollY) {
  const start = dockRange(heroHeight, cutPin).to;
  const end = endTop === null ? pageHeight - viewport : endTop - viewport * (1 + END_OFFSET);
  return { start, span: Math.max(end - start, 1), endTop: endTop === null ? Infinity : endTop - scrollY };
}

/**
 * Hero pose for a layer of `screen` size: centre and long axis in CSS px, rotation as Euler radians
 * (z = tilt in the screen plane, y = yaw, x = pitch). unit: px per world unit; length: long axis in world units.
 * idle: 0..1, how much of the float and sway plays.
 */
export function heroPose(screen, unit, length, time = 0, idle = 1) {
  const hero = screen.width >= DESKTOP_MIN_PX ? HERO.desktop : HERO.mobile;
  return {
    x: screen.width / 2 + hero.x * screen.width,
    y: screen.height / 2 - hero.y * screen.height - idle * FLOAT.amp * unit * Math.sin(TAU * FLOAT.hz * time),
    length: hero.scale * length * unit,
    rotation: { x: 0, y: hero.yaw + idle * SWAY.amp * Math.sin(TAU * SWAY.hz * time), z: hero.tilt },
  };
}

// The About text fills the screen through the hero cut: rather than fly across it from the cut's end (left edge)
// to the track (right edge), the shears fade out early in the dock and back in at its end, on the track.
const DOCK_DIP = { out: 0.1, in: 0.92 };
const dockVisibility = (dock) =>
  1 - ease(clamp01(dock / DOCK_DIP.out)) + ease(clamp01((dock - DOCK_DIP.in) / (1 - DOCK_DIP.in)));

/**
 * Returns step(input) → frame. input: { dt (s), scrollY, dock (0..1), signals, screen, unit, length, maxOpen }.
 * The frame: centre / length in CSS px, hero and track rotations plus their linear mix, opening (degrees per half),
 * opacity and whether another frame is needed. Also publishes visibility and an approximate tip position on `rig`.
 */
export function createRigMotion() {
  const lean = { x: 0, y: 0 };
  let smoothY = null;
  let shown = null; // linear visibility 0..1, eased into the opacity
  let cutAt = null; // performance.now() when the end element crossed CUT_LINE
  let time = 0; // s of drawn motion: it stands still while nothing is drawn, so waking up carries on without a jump
  let still = 0; // s since the scroll, the pointer or the screen last changed
  let idle = 1; // 0..1: how much of the hero's float and idle snips plays
  const last = { scrollY: NaN, x: 0, y: 0, width: 0, height: 0 };

  return function step({ dt: rawDt, scrollY, dock, signals, screen, unit, length, maxOpen }) {
    const dt = Math.min(rawDt, MAX_DT);
    time += dt;
    const { pointer } = signals;
    const moved = scrollY !== last.scrollY || pointer.x !== last.x || pointer.y !== last.y || screen.width !== last.width || screen.height !== last.height;
    Object.assign(last, { scrollY, x: pointer.x, y: pointer.y, width: screen.width, height: screen.height });
    still = moved ? 0 : still + dt;
    idle = clamp01(idle + (still < IDLE.after ? dt : -dt) / IDLE.fade);
    if (smoothY === null || Math.abs(scrollY - smoothY) <= LAG_SETTLE) smoothY = scrollY;
    else smoothY += (scrollY - smoothY) * (1 - Math.exp(-LAG * dt));

    const range = readTrack(signals, scrollY);
    const p = clamp01((smoothY - range.start) / range.span);
    const track = screen.width >= DESKTOP_MIN_PX ? TRACK.desktop : TRACK.mobile;
    const point = trackPoint(p, { width: signals.pageWidth, height: screen.height }, signals.gutter, track);

    const k = 1 - (1 - POINTER.lerp) ** (dt * 60); // frame-rate independent lerp
    const leanX = signals.pointer.y * POINTER.max;
    const leanY = signals.pointer.x * POINTER.max;
    lean.x += (leanX - lean.x) * k;
    lean.y += (leanY - lean.y) * k;

    const hero = heroPose(screen, unit, length, time, idle);
    hero.rotation.x += lean.x;
    hero.rotation.y += lean.y;

    // Hero cut: raw scroll (no lag) keeps the tip on the line the hero draws.
    const phases = heroCutPhases(scrollY, signals.cutPin);
    const aim = ease(phases.aim);
    const cut = cutPose(phases.along, signals.pageWidth, signals.heroHeight, maxOpen);
    const before = {
      x: lerp(hero.x, cut.x, aim),
      y: lerp(hero.y, cut.y, aim),
      length: lerp(hero.length, cut.length, aim),
      rotation: mix(hero.rotation, { x: cut.rotation.x + lean.x, y: cut.rotation.y + lean.y, z: cut.rotation.z }, aim),
      open: lerp(idle * idleSnip(time, maxOpen), cut.open, aim),
      roll: CUT_ROLL * aim,
    };

    const turn = trackTurn(p);
    const trackRotation = { x: turn.x + lean.x, y: turn.y + lean.y, z: nearAngle(point.tilt, before.rotation.z) };
    const rotation = mix(before.rotation, trackRotation, dock);
    const burst = burstElapsed();
    const now = performance.now();
    const pastCut = range.endTop < signals.viewHeight * CUT_LINE;
    cutAt = pastCut ? (cutAt ?? now) : null;
    const holding = pastCut && (now - cutAt) / 1000 < BURST_DURATION; // the final snips play before the fade
    const target = pastCut && !holding ? 0 : 1;
    shown = shown === null ? target : clamp01(shown + Math.sign(target - shown) * (dt / CUT_FADE));
    const docking = dockVisibility(dock);
    const opacity = Math.round(ease(shown) * docking * 1000) / 1000;
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
      reach: cut.reach, // px: the sheet is already cut this far ahead of the pivot (3D only)
      opacity,
      active: !signals.pageHidden && ((signals.heroVisible && idle > 0) || leaning || smoothY !== scrollY || burst < BURST_DURATION || holding || shown !== target),
    };

    const scene = getScene();
    if (scene?.weight > 0) applyScene(frame, scene, track.length, maxOpen);
    const { rotation: final } = frame; // applyScene may have replaced it

    const reach = (frame.length / 2) * Math.cos(final.x);
    rig.visible = frame.opacity > 0;
    rig.tipX = frame.x - reach * Math.sin(final.z);
    rig.tipY = frame.y - reach * Math.cos(final.z);
    return frame;
  };
}
