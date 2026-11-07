// Renderer-free motion of the shears in CSS px, shared by the 3D rig and the 2D fallback.
import {
  BURST_DURATION, CUT_FADE, CUT_LINE, DESKTOP_MIN_PX, DOCK_END, END_OFFSET, FLOAT, HERO, SWAY, TRACK,
  clamp, easeFade, idleSnip, lerp, scrollSnip, trackPoint, trackTurn, withBurst,
} from './pose.js';
import { burstElapsed, rig } from './rig.js';

const TAU = Math.PI * 2;
const POINTER = { max: 8 * (Math.PI / 180), lerp: 0.08, settle: 1e-4 };
const LAG = 8; // 1/s: the shears trail the scroll, as in the reference demo
const LAG_SETTLE = 0.5; // px
const MAX_DT = 0.05;
const END_SELECTOR = '[data-scissors-end]';

/**
 * Scroll range of the track in scrollY px. It ends END_OFFSET viewports before the
 * [data-scissors-end] element scrolls into view, or at the page bottom when there is none.
 * endTop is that element's viewport top (Infinity without one).
 */
function readTrack(heroHeight) {
  const viewport = window.innerHeight;
  const start = heroHeight * DOCK_END;
  const endEl = document.querySelector(END_SELECTOR);
  const endTop = endEl ? endEl.getBoundingClientRect().top : Infinity;
  const end = endEl
    ? endTop + window.scrollY - viewport * (1 + END_OFFSET)
    : document.documentElement.scrollHeight - viewport;
  return { start, span: Math.max(end - start, 1), endTop };
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

    const range = readTrack(signals.heroHeight);
    const p = clamp((smoothY - range.start) / range.span, 0, 1);
    const track = screen.width >= DESKTOP_MIN_PX ? TRACK.desktop : TRACK.mobile;
    const point = trackPoint(p, { width: document.documentElement.clientWidth, height: screen.height }, signals.gutter, track);

    const k = 1 - (1 - POINTER.lerp) ** (dt * 60); // frame-rate independent lerp
    const leanX = signals.pointer.y * POINTER.max;
    const leanY = signals.pointer.x * POINTER.max;
    lean.x += (leanX - lean.x) * k;
    lean.y += (leanY - lean.y) * k;

    const hero = heroPose(screen, unit, length, time);
    hero.rotation.x += lean.x;
    hero.rotation.y += lean.y;
    const turn = trackTurn(p);
    const trackRotation = { x: turn.x + lean.x, y: turn.y + lean.y, z: point.tilt };
    const rotation = mix(hero.rotation, trackRotation, dock);
    const burst = burstElapsed();
    const now = performance.now();
    const pastCut = range.endTop < window.innerHeight * CUT_LINE;
    if (!pastCut) cutAt = null;
    else if (cutAt === null) cutAt = now;
    const holding = pastCut && (now - cutAt) / 1000 < BURST_DURATION; // the final snips play before the fade
    const target = pastCut && !holding ? 0 : 1;
    shown = shown === null ? target : clamp(shown + Math.sign(target - shown) * (dt / CUT_FADE), 0, 1);
    const opacity = Math.round(easeFade(shown) * 1000) / 1000;
    const leaning = Math.abs(leanX - lean.x) + Math.abs(leanY - lean.y) > POINTER.settle;

    const frame = {
      x: lerp(hero.x, point.x, dock),
      y: lerp(hero.y, point.y, dock),
      length: lerp(hero.length, track.length, dock),
      dock,
      heroRotation: hero.rotation,
      trackRotation,
      rotation,
      open: withBurst(lerp(idleSnip(time, maxOpen), scrollSnip(smoothY, screen.height), dock), burst),
      opacity,
      active: !signals.pageHidden && (signals.heroVisible || leaning || smoothY !== scrollY || burst < BURST_DURATION || holding || shown !== target),
    };

    const reach = (frame.length / 2) * Math.cos(rotation.x);
    rig.visible = opacity > 0;
    rig.tipX = frame.x - reach * Math.sin(rotation.z);
    rig.tipY = frame.y - reach * Math.cos(rotation.z);
    return frame;
  };
}
