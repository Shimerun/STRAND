import { GLYPHS } from './stencilGlyphs.js';

// The footer stencil's cut as a timeline in bites. Each contour (holes first: the letter hangs in the sheet until
// its outline is through) is cut in bites of about `step` view units, never across a corner. The tips only ever
// move forward along the cut: each bite they run on and slow down again, the blades nibbling (opening up to NIBBLE
// between bites, shut mid-bite). Between contours they glide to the next start; a freed letter settles by SAG.
const CORNER = (40 * Math.PI) / 180; // a turn sharper than this between two polyline steps is a corner
const MIN_RUN = 12; // view units: a corner closer than this to the previous one is not a new bite
const DURATION = { bite: 1, travel: 1, tail: 1 }; // in bites; tail: after the last bite, before the shears leave
const NIBBLE = 0.35; // how far the blades open between bites, share of the opening
const LOOK = 40; // view units ahead along the cut that set which way it runs
export const SAG = 3; // view units the cut-out letter drops in its hole once free

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const unit = (x, y) => ({ x: x / (Math.hypot(x, y) || 1), y: y / (Math.hypot(x, y) || 1) });
const towards = (a, b) => unit(b.x - a.x, b.y - a.y);

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

// Where the bites end along a contour: at every corner, and evenly between corners.
function biteEnds(line, step) {
  const { xs, ys, cum, length } = line;
  const corners = [0];
  for (let i = 1; i < xs.length - 1; i++) {
    const a = Math.atan2(ys[i] - ys[i - 1], xs[i] - xs[i - 1]);
    const b = Math.atan2(ys[i + 1] - ys[i], xs[i + 1] - xs[i]);
    const turn = Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
    if (turn > CORNER && cum[i] - corners.at(-1) >= MIN_RUN && length - cum[i] >= MIN_RUN) corners.push(cum[i]);
  }
  corners.push(length);
  const ends = [0];
  for (let r = 1; r < corners.length; r++) {
    const run = corners[r] - corners[r - 1];
    const bites = Math.max(1, Math.round(run / step));
    for (let k = 1; k <= bites; k++) ends.push(corners[r - 1] + (run * k) / bites);
  }
  return ends;
}

/**
 * The cut of `word`, its letters drawn at boxes[i].x on `baseline` (view units). Letters with no outline in
 * stencilGlyphs.js are left out. Returns { contours, segments, total (bites), freed (per letter, bites) }.
 */
export function buildCutPlan(word, boxes, baseline, step) {
  const contours = [];
  [...word].forEach((char, letter) => {
    (GLYPHS[char] ?? []).forEach((flat, index) => {
      const line = polyline(flat, boxes[letter].x, baseline);
      contours.push({ ...line, letter, index, ends: biteEnds(line, step) });
    });
  });
  const segments = [];
  let time = 0;
  const add = (kind, g, k = 0) => {
    segments.push({ kind, g, k, t0: time, t1: time + DURATION[kind] });
    time += DURATION[kind];
  };
  const freed = [];
  contours.forEach((contour, g) => {
    contour.from = time;
    for (let k = 0; k < contour.ends.length - 1; k++) add('bite', g, k);
    contour.to = time;
    freed[contour.letter] = time;
    add(contours[g + 1] ? 'travel' : 'tail', g);
  });
  return { contours, segments, total: time, freed };
}

// Which way an outline runs at s: the chord LOOK ahead, wrapping round to its start, so it turns smoothly round a
// corner and never jumps at the end of the outline.
const runsAt = (line, s) => towards(pointAt(line, s), pointAt(line, (s + LOOK) % line.length));

/**
 * The shears at `time` (bites): the contour being cut (g), its cut length, where the tips are (at: the end of the
 * cut, or on the way to the next contour), which way the cut runs there (dir) and the opening 0..1.
 */
export function cutState(plan, time) {
  const seg = plan.segments.find((s) => time < s.t1) ?? plan.segments.at(-1);
  const q = clamp01((time - seg.t0) / (seg.t1 - seg.t0));
  const line = plan.contours[seg.g];
  const { g, k } = seg;
  if (seg.kind === 'bite') {
    const cut = lerp(line.ends[k], line.ends[k + 1], ease(q));
    return { g, cut, at: pointAt(line, cut), dir: runsAt(line, cut), open: NIBBLE * (0.5 + 0.5 * Math.cos(2 * Math.PI * q)) };
  }
  // On to the next contour (after the last one: stay), turning the short way round.
  const [end, next] = [pointAt(line, line.length), seg.kind === 'travel' ? plan.contours[g + 1] : null];
  const from = runsAt(line, line.length);
  if (!next) return { g, cut: line.length, at: end, dir: from, open: NIBBLE };
  const to = runsAt(next, 0);
  const [a, b, e] = [Math.atan2(from.y, from.x), Math.atan2(to.y, to.x), ease(q)];
  const angle = a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * e;
  return { g, cut: line.length, at: mix(end, pointAt(next, 0), e), dir: { x: Math.cos(angle), y: Math.sin(angle) }, open: NIBBLE };
}

/** How much of contour g is cut at `time` (view units). */
export function cutLength(plan, g, time) {
  const line = plan.contours[g];
  if (time <= line.from) return 0;
  if (time >= line.to) return line.length;
  return cutState(plan, time).cut;
}

/** 0..1: how far the letter has settled into its hole after its outline was cut through. */
export function settled(plan, letter, time) {
  return ease(clamp01((time - plan.freed[letter]) / DURATION.travel));
}
