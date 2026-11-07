// Pure pose math shared by the 3D shears and the 2D fallback; must not import three.js.
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const HEADER_PX = 72; // tailwind spacing.header
export const DESKTOP_MIN_PX = 1024;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (value, min, max) => {
  const t = clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
};

// The 3D camera; the 2D fallback uses the same framing.
export const CAMERA = { fov: 35, position: [0, 0, 10], near: 0.1, far: 50 };
export const VIEW_HEIGHT = 2 * CAMERA.position[2] * Math.tan((CAMERA.fov / 2) * DEG); // world units across the viewport
// Mirrors CONFIG.SCALE and CONFIG.MAX_OPEN in Shears.jsx, which the fallback can't import without three.js.
export const FLAT = { length: 4, maxOpen: 30 };

// Hero pose: x / y as fractions of the viewport (world units at z = 0), scale relative to CONFIG.SCALE.
export const HERO = {
  desktop: { x: 0.22, y: 0, scale: 1, tilt: -35 * DEG, yaw: 18 * DEG },
  mobile: { x: 0, y: -0.04, scale: 0.62, tilt: -35 * DEG, yaw: 18 * DEG },
};
export const FLOAT = { amp: 0.06, hz: 0.8 };
export const SWAY = { amp: 12 * DEG, hz: 0.25 };

// Docked track in CSS px. edge: where in the gutter the shears run (0 = inner edge, 1 = screen edge);
// on mobile 0.8 pushes ~30% of the 130px shears (≈ 41px wide) past the screen edge.
export const TRACK = {
  desktop: { length: 260, drift: 40, edge: 0.5, top: 24, bottom: 32 },
  mobile: { length: 130, drift: 14, edge: 0.8, top: 16, bottom: 96 },
};
export const DOCK_END = 0.6; // fraction of the hero height scrolled when the shears sit on the track
export const END_OFFSET = 0.3; // track ends this many viewports before the end element scrolls into view
// Final cut: the end element's top crosses this fraction of the viewport; the shears snip, then fade out.
export const CUT_LINE = 0.6;
export const CUT_FADE = 0.8; // s

const SNIP_DEG = 17; // opening per half, as in the demo
const IDLE_SNIP = { period: 2.8, open: 0.35, close: 0.25 };
const BURST = { count: 3, open: 0.07, close: 0.09 };
export const BURST_DURATION = BURST.count * (BURST.open + BURST.close);

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// 0 → 1 → 0 over one snip; 0 outside it.
function pulse(phase, open, close) {
  if (phase < open) return easeInOut(phase / open);
  if (phase < open + close) return 1 - easeInOut((phase - open) / close);
  return 0;
}

// Degrees per half for the hero's idle snip at a given time.
export function idleSnip(time, maxOpen) {
  return maxOpen * pulse(time % IDLE_SNIP.period, IDLE_SNIP.open, IDLE_SNIP.close);
}

// Degrees per half on the track: one full snip per screen of scroll (the demo snips once per section).
export function scrollSnip(scrollY, screenHeight) {
  return SNIP_DEG * Math.sin((Math.PI * scrollY) / screenHeight) ** 2;
}

// Bends an angle towards a burst snip; returns the angle unchanged outside the burst.
export function withBurst(angle, elapsed) {
  if (elapsed < 0 || elapsed >= BURST_DURATION) return angle;
  const period = BURST.open + BURST.close;
  return lerp(angle, SNIP_DEG, pulse(elapsed % period, BURST.open, BURST.close));
}

// Rotation about the screen X and the long axis along the track: the shears turn over
// and straighten up on the way down, like the demo's scroll mode.
export function trackTurn(p) {
  const eased = easeInOutCubic(p);
  return { x: -0.5 + 0.5 * eased, y: 0.6 - Math.PI * eased + 0.4 * Math.sin(Math.PI * p) };
}

/**
 * Centre and tilt of the docked shears at track progress p (0..1).
 * screen: { width, height } in CSS px; gutter in CSS px. Returns { x, y } in CSS px and tilt in radians
 * (tips down, following the direction of travel along the S-curve).
 */
export function trackPoint(p, screen, gutter, track) {
  const half = track.length / 2;
  const top = HEADER_PX + track.top + half;
  const span = Math.max(screen.height - track.bottom - half - top, 1);
  const wave = TAU * p;
  const slope = (track.drift * TAU * Math.cos(wave)) / span; // dx / dy along the track
  return {
    x: screen.width - gutter * (1 - track.edge) + track.drift * Math.sin(wave),
    y: top + span * p,
    tilt: -Math.PI + Math.atan(slope),
  };
}

// Eased opacity for a linear fade value 0..1.
export function easeFade(t) {
  return smoothstep(t, 0, 1);
}
