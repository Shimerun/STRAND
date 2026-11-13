// Pure math for the hero cut behaving as a sheet of paper: the wedge the blades push open, the cut-off strip
// lifting off the page about the cutting point, and its fall once the cut is through.

import { pointAt } from '../../lib/heroCut.js';

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;

// At the blades the strip is pushed aside by the lower blade's body: the gap opens as a wedge `px` wide at the
// cutting point (`press` px more while the blades bear down) that closes over `ramp` px back along the cut.
const WEDGE = { px: 3, press: 2, ramp: 140 };
// The blades bear on the paper only where they cross: the dent reaches `ahead` px past the cutting point (no
// further than where the blades will meet) and `behind` px back along the cut, deepest at the cutting point.
const CREASE = { ahead: 56, behind: 14, step: 5 };
// The lower blade lifts the strip as it passes under it: the strip folds up towards the viewer by up to `deg`
// once the cut is through (growing with share^power), seen through a perspective of `perspective` px. It folds
// about the chord of the cut so far (cutting point to frame edge), so the whole strip comes forward and still
// covers the frame edges: folded into the screen, or about a level axis, it shrank away from them in slivers.
export const FOLD = { deg: 8, power: 1.5, perspective: 2400 };
// The strip falls like a sheet of paper: it drops `y` frame heights, slowed by the air (`drag` < 2 is less of an
// ease-in than a free fall), swinging `swings` times side to side by `sway` of the frame width; it tips `tilt` deg
// into each swing, turns `yaw` deg about its vertical axis and pitches back by `pitch` deg; `spin` deg overall.
// `settle`: share of the fall over which the swinging builds up. Off screen when the pin ends.
const FALL = { y: 1.05, drag: 1.6, swings: 1.25, sway: 0.05, tilt: 7, yaw: 14, pitch: 22, spin: 6, settle: 0.25, perspective: 1600 };

/** The strip's edge: the cut so far (cutting order) pushed down by the wedge near its last point. */
export function wedged(points, press = 0) {
  const px = WEDGE.px + WEDGE.press * press;
  const n = points.length;
  const out = new Array(n);
  let back = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (i < n - 1) back += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    const t = Math.max(1 - back / WEDGE.ramp, 0);
    out[i] = t ? { x: points[i].x, y: points[i].y + px * t * t } : points[i];
  }
  return out;
}

/**
 * The paper the closing blades press around the cutting point, along the line: { points, depth } with depth 0..1
 * per point (the press, falling off away from the cutting point), or null while they do not press.
 */
export function creaseAt(geometry, { cut, shut, press }) {
  const ahead = Math.min(CREASE.ahead, shut - cut);
  if (press <= 0 || ahead < 1) return null;
  const from = Math.max(cut - CREASE.behind, 0);
  const n = Math.max(2, Math.ceil((cut + ahead - from) / CREASE.step));
  const points = [];
  const depth = [];
  for (let i = 0; i <= n; i++) {
    const d = from + ((cut + ahead - from) * i) / n;
    const away = d < cut ? (cut - d) / CREASE.behind : (d - cut) / ahead;
    points.push(pointAt(geometry, d));
    depth.push(press * (1 - Math.min(away, 1)) ** 2);
  }
  return { points, depth };
}

/** Fold of the strip in degrees at cut share `share` (0..1); positive: its far edge comes towards the viewer. */
export const foldAt = (share) => FOLD.deg * share ** FOLD.power;

// The fold axis in radians: from the cutting point (the cut's last point) to where the cut entered the frame.
const axisOf = (cut) => Math.atan2(cut[0].y - cut[cut.length - 1].y, cut[0].x - cut[cut.length - 1].x);

/**
 * CSS transform of the strip, about the cutting point (its transform origin): the sag (a skew, given as its
 * tangent), then the fold by `deg` about the cut's chord, in perspective. cut: the cut so far, cutting order.
 */
export function foldTransform(cut, tan, deg) {
  const axis = axisOf(cut) / RAD;
  return `perspective(${FOLD.perspective}px) rotate(${axis}deg) rotateX(${deg}deg) rotate(${-axis}deg) skewY(${Math.atan(tan) / RAD}deg)`;
}

/** Where `points` of the strip land on screen under foldTransform(cut, tan, deg); keeps the marks on its edge. */
export function folded(points, cut, tan, deg) {
  const hinge = cut[cut.length - 1];
  const axis = axisOf(cut);
  const [ca, sa] = [Math.cos(axis), Math.sin(axis)];
  const [cf, sf] = [Math.cos(deg * RAD), Math.sin(deg * RAD)];
  return points.map(({ x, y }) => {
    const dx = x - hinge.x;
    const dy = y - hinge.y + dx * tan;
    const u = dx * ca + dy * sa; // along the axis
    const across = -dx * sa + dy * ca;
    const v = across * cf; // foreshortened by the fold, which brings it `across * sf` px towards the viewer
    const scale = FOLD.perspective / (FOLD.perspective - across * sf);
    return { x: hinge.x + (u * ca - v * sa) * scale, y: hinge.y + (u * sa + v * ca) * scale };
  });
}

/** The falling strip's transform at split progress `split` (0..1) for a frame of width × height px. */
export function fallAt(split, width, height) {
  const swing = TAU * FALL.swings * split;
  const build = Math.min(split / FALL.settle, 1);
  return {
    x: width * FALL.sway * Math.sin(swing) * build,
    y: height * FALL.y * split ** FALL.drag,
    // Tipped the way it moves: the leading side lower.
    rotate: FALL.spin * split + FALL.tilt * Math.cos(swing) * build,
    rotateX: -FALL.pitch * split,
    rotateY: FALL.yaw * Math.sin(swing + 1) * build,
    perspective: FALL.perspective,
  };
}
