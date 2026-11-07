import { MathUtils } from 'three';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const HEADER_PX = 72; // tailwind spacing.header
export const DESKTOP_MIN_PX = 1024;

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
const FADE_FROM = 0.85;

const IDLE_SNIP = { period: 2.8, open: 0.35, close: 0.25 };
const BURST = { count: 3, open: 0.07, close: 0.09, deg: 24 };
export const BURST_DURATION = BURST.count * (BURST.open + BURST.close);
export const REST_DEG = 3;

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

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

// Degrees per half from the scroll distance: faster scrolling means faster snipping.
export function scrollSnip(scrollY, maxOpen) {
  return MathUtils.clamp(11 + 10 * Math.sin(scrollY / 50), 1, maxOpen);
}

// Bends an angle towards a burst snip; returns the angle unchanged outside the burst.
export function withBurst(angle, elapsed, maxOpen) {
  if (elapsed < 0 || elapsed >= BURST_DURATION) return angle;
  const period = BURST.open + BURST.close;
  return MathUtils.lerp(angle, Math.min(BURST.deg, maxOpen), pulse(elapsed % period, BURST.open, BURST.close));
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

// Opacity over the last part of the track.
export function trackFade(p) {
  return 1 - MathUtils.smoothstep(p, FADE_FROM, 1);
}
