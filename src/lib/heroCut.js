// Scroll-driven cut of the hero, shared by the hero (DOM) and the shears (rig) so the blades and the cut agree.
// The hero pins for `pin` hero heights of scroll: the shears move onto a wavy line and cut it right to left,
// snip by snip; then the halves part and swell towards the viewer while the next section shows through the cut.
export const HERO_CUT = {
  pin: 3, // extra scroll while the hero stays pinned, in hero (frame) heights
  aimEnd: 0.08, // share of the pin: the shears move from the hero pose onto the line
  cutEnd: 0.72, // share of the pin: the last snip; the halves part over the rest
  right: 0.44, // line height at the right edge, share of the frame height
  left: 0.56, // line height at the left edge (before the wave)
  wave: [
    { amp: 0.07, cycles: 1.1, phase: 0 }, // the main bend, share of the height / cycles across the width
    { amp: 0.012, cycles: 3.3, phase: 1 }, // a small wobble, as if cut by hand
  ],
  overshoot: 0.04, // the cut starts and ends this share of the width beyond the edges
  snipWidth: 210, // px of screen width per snip
  minSnips: 3,
  maxSnips: 7,
  openShare: 0.8, // how wide the blades open while cutting, share of the model's max opening
  sag: 1.6, // degrees the cut-off flap droops around the cutting point by the end of the cut
};

const SAMPLES = 160;
const TAU = Math.PI * 2;
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const ease = (t) => t * t * (3 - 2 * t);

/** Progress 0..1 of each phase at `scrollY` for a pin of `pin` px (0 = no cut, everything stays 0). */
export function heroCutPhases(scrollY, pin) {
  if (pin <= 0) return { aim: 0, along: 0, split: 0 };
  const aimEnd = HERO_CUT.aimEnd * pin;
  const cutEnd = HERO_CUT.cutEnd * pin;
  return {
    aim: clamp01(scrollY / aimEnd),
    along: clamp01((scrollY - aimEnd) / (cutEnd - aimEnd)),
    split: clamp01((scrollY - cutEnd) / (pin - cutEnd)),
  };
}

// The wave is scaled by the width too, so a tall phone screen gets a gentle bend the blades can follow.
const BEND_PER_WIDTH = 0.6;

// u: 0 at the right edge, 1 at the left edge (the way the shears cut).
function curvePoint(u, width, height) {
  const bend = HERO_CUT.wave.reduce((sum, { amp, cycles, phase }) => sum + amp * Math.sin(TAU * cycles * u + phase), 0);
  const base = height * (HERO_CUT.right + (HERO_CUT.left - HERO_CUT.right) * u);
  return { x: width * (1 - u), y: base + bend * Math.min(height, width * BEND_PER_WIDTH) };
}

let cached = null;

/**
 * The cut line in frame px, sampled from past the right edge to past the left edge with the distance
 * along it: { points: [{ x, y, d }], total, snips, step }. Cached for the last frame size.
 */
export function cutGeometry(width, height) {
  if (cached && cached.width === width && cached.height === height) return cached;
  const { overshoot } = HERO_CUT;
  const points = [];
  let d = 0;
  for (let i = 0; i <= SAMPLES; i++) {
    const point = curvePoint(-overshoot + ((1 + 2 * overshoot) * i) / SAMPLES, width, height);
    if (i > 0) d += Math.hypot(point.x - points[i - 1].x, point.y - points[i - 1].y);
    points.push({ ...point, d });
  }
  const snips = Math.min(Math.max(Math.round(width / HERO_CUT.snipWidth), HERO_CUT.minSnips), HERO_CUT.maxSnips);
  cached = { width, height, points, total: d, snips, step: d / snips };
  return cached;
}

/** Point at distance `d` along the line; past either end it carries on straight. */
export function pointAt(geometry, d) {
  const { points } = geometry;
  let i = 1;
  while (i < points.length - 1 && points[i].d < d) i++;
  const a = points[i - 1];
  const b = points[i];
  const t = (d - a.d) / (b.d - a.d || 1);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Blades at cut progress `along` (0..1). Each snip first closes in place, so the cutting point runs from
 * the pivot to the tips and the cut grows by one blade, then opens while the shears push forward one blade.
 * The blades (the model's pivot is its centre, so blade = half the length) span the chord to where they
 * will next shut and aim along it, so the tips meet the curve exactly when they close.
 */
export function cutState(along, width, height) {
  const geometry = cutGeometry(width, height);
  const { step, snips, total } = geometry;
  const progress = along * snips;
  const snip = Math.floor(progress);
  const phase = progress - snip;
  const closing = phase < 0.5;
  const t = ease(closing ? phase * 2 : phase * 2 - 1);
  const pivotD = snip * step + (closing ? 0 : step * t);
  const cut = Math.min(snip * step + (closing ? step * t : step), total);
  const pivot = pointAt(geometry, pivotD);
  const ahead = pointAt(geometry, pivotD + step);
  const chord = Math.hypot(ahead.x - pivot.x, ahead.y - pivot.y) || 1;
  return {
    pivot,
    cutEnd: pointAt(geometry, cut),
    cut,
    share: cut / total,
    open: closing ? 1 - t : t,
    dir: { x: (ahead.x - pivot.x) / chord, y: (ahead.y - pivot.y) / chord },
    blade: chord,
    closings: Math.min(Math.floor(progress + 0.5), snips),
  };
}

/**
 * Line points from the right edge of the frame up to the cutting point, in cutting order. The last one is
 * the hinge the cut-off flap hangs from (the right edge itself until the cut enters the frame).
 */
export function cutSoFar(geometry, cutEnd) {
  const edge = curvePoint(0, geometry.width, geometry.height);
  if (cutEnd.x >= edge.x) return [edge];
  const inside = geometry.points.filter((point) => point.x < edge.x && point.x > cutEnd.x);
  return [edge, ...inside, cutEnd];
}

/** SVG path of the whole line. */
export function cutPath(geometry) {
  return geometry.points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
}
