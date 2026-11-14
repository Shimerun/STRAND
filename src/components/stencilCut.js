import { GLYPHS } from './stencilGlyphs.js';

// The footer stencil's cut as a timeline measured in view units travelled by the tips, so a steady clock moves
// them at a steady speed. They trace each contour in one go (holes first: the letter hangs in the sheet until its
// outline is through), then glide to the next start a little faster, through the air. The blades open and shut a
// little as they go, slowly; a letter whose outline is through settles in its hole by SAG.
const AIR = 1.5; // how much faster the tips move between contours than along a cut
const SETTLE = 160; // view units of time a freed letter takes to settle
const TAIL = SETTLE; // view units of time after the last cut, so the last letter settles before the shears leave
const SNIP = { every: 240, open: 0.25 }; // one slow open-and-shut of the blades per `every` units, this far open
const LOOK = 40; // view units ahead along the cut that set which way it runs
export const SAG = 3; // view units the cut-out letter drops in its hole once free

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const unit = (x, y) => ({ x: x / (Math.hypot(x, y) || 1), y: y / (Math.hypot(x, y) || 1) });
const towards = (a, b) => unit(b.x - a.x, b.y - a.y);
// 0..1 along the glide between contours, leaving and arriving at the cutting speed (a cubic Hermite curve), so the
// tips never stop dead at the end of an outline.
const glide = (q, m = 1 / AIR) => (2 * m - 2) * q ** 3 + (3 - 3 * m) * q ** 2 + m * q;

/** "M x y L … Z" for one flat contour [x, y, …]. */
export function contourPath(flat) {
  const points = [];
  for (let i = 0; i < flat.length; i += 2) points.push(`${flat[i]} ${flat[i + 1]}`);
  return `M${points.join('L')}Z`;
}

// A closed polyline in view units with its running length; repeated points are dropped so every step has a direction.
function polyline(flat, dx, dy) {
  const [xs, ys] = [[], []];
  for (let i = 0; i <= flat.length; i += 2) {
    const x = flat[i % flat.length] + dx;
    const y = flat[(i + 1) % flat.length] + dy;
    if (xs.length && x === xs.at(-1) && y === ys.at(-1)) continue;
    xs.push(x);
    ys.push(y);
  }
  const cum = [0];
  for (let i = 1; i < xs.length; i++) cum.push(cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
  return { xs, ys, cum, length: cum.at(-1) };
}

function pointAt(line, s) {
  const d = Math.min(Math.max(s, 0), line.length);
  let [lo, hi] = [0, line.cum.length - 1];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (line.cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const t = (d - line.cum[lo]) / (line.cum[hi] - line.cum[lo] || 1);
  return { x: lerp(line.xs[lo], line.xs[hi], t), y: lerp(line.ys[lo], line.ys[hi], t) };
}

// Which way an outline runs at s: the chord LOOK ahead, wrapping round to its start, so it turns smoothly round a
// corner and never jumps at the end of the outline.
const runsAt = (line, s) => towards(pointAt(line, s), pointAt(line, (s + LOOK) % line.length));

/**
 * The cut of `word`, its letters drawn at boxes[i].x on `baseline` (view units). Letters with no outline in
 * stencilGlyphs.js are left out. Returns { contours, segments, total, freed (per letter) }, times in view units.
 */
export function buildCutPlan(word, boxes, baseline) {
  const contours = [];
  [...word].forEach((char, letter) => {
    (GLYPHS[char] ?? []).forEach((flat, index) => contours.push({ ...polyline(flat, boxes[letter].x, baseline), letter, index }));
  });
  const segments = [];
  const freed = [];
  let time = 0;
  contours.forEach((line, g) => {
    const next = contours[g + 1];
    line.from = time;
    line.to = time + line.length;
    freed[line.letter] = line.to;
    const gap = next ? Math.hypot(next.xs[0] - line.xs[0], next.ys[0] - line.ys[0]) / AIR : TAIL;
    segments.push({ kind: 'trace', g, t0: time, t1: line.to });
    segments.push({ kind: next ? 'travel' : 'tail', g, t0: line.to, t1: line.to + Math.max(gap, 1) });
    time = segments.at(-1).t1;
  });
  return { contours, segments, total: time, freed };
}

/**
 * The shears at `time`: the contour being cut (g), its cut length, where the tips are (at: the end of the cut, or
 * on the way to the next contour), which way the cut runs there (dir) and the opening 0..1.
 */
export function cutState(plan, time) {
  const seg = plan.segments.find((s) => time < s.t1) ?? plan.segments.at(-1);
  const line = plan.contours[seg.g];
  const open = SNIP.open * (0.5 - 0.5 * Math.cos((2 * Math.PI * Math.max(time, 0)) / SNIP.every));
  if (seg.kind === 'trace') {
    const cut = Math.min(Math.max(time - seg.t0, 0), line.length);
    return { g: seg.g, cut, at: pointAt(line, cut), dir: runsAt(line, cut), open };
  }
  // On to the next contour (after the last one: stay), turning the short way round.
  const [end, next] = [pointAt(line, line.length), seg.kind === 'travel' ? plan.contours[seg.g + 1] : null];
  const from = runsAt(line, line.length);
  if (!next) return { g: seg.g, cut: line.length, at: end, dir: from, open };
  const to = runsAt(next, 0);
  const q = clamp01((time - seg.t0) / (seg.t1 - seg.t0));
  const [a, b] = [Math.atan2(from.y, from.x), Math.atan2(to.y, to.x)];
  const angle = a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * ease(q);
  return { g: seg.g, cut: line.length, at: mix(end, pointAt(next, 0), glide(q)), dir: { x: Math.cos(angle), y: Math.sin(angle) }, open };
}

// The shears are held like a pen in a right hand: tips down and a little left (HOLD, rad clockwise from pointing
// right), leaning up to LEAN as a dragged pen trails. Aimed along the cut they spun round every outline; aimed one
// way, they looked dragged backwards half the way round.
const [HOLD, LEAN] = [(115 * Math.PI) / 180, (12 * Math.PI) / 180];
const SIZE = 0.45; // share of the rig's track length: about a letter long, so they do not sweep over the next ones

/** The shears at `time`: where the tips are, the way they point (aim), how far open and their size (rig scale). */
export function shearsAt(plan, time) {
  const { at, dir, open } = cutState(plan, time);
  const angle = HOLD + LEAN * dir.x;
  return { at, aim: { x: Math.cos(angle), y: Math.sin(angle) }, open, size: SIZE };
}

/** How much of contour g is cut at `time` (view units). */
export function cutLength(plan, g, time) {
  const line = plan.contours[g];
  return Math.min(Math.max(time - line.from, 0), line.length);
}

/** 0..1: how far the letter has settled into its hole after its outline was cut through. */
export function settled(plan, letter, time) {
  return ease(clamp01((time - plan.freed[letter]) / SETTLE));
}
