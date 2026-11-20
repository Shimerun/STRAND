import { motion, useTransform } from 'framer-motion';

// The cut edges show the paper's core: a hairline along the top piece, which lies flat, and a thicker line along
// the strip, whose edge is seen face-on as it lifts.
const EDGE = { top: { width: 1, opacity: 0.5 }, flap: { width: 1.75, opacity: 0.75 } };
// The sheet hangs over the next section: under it the gap is dimmed by `base`, and the top piece throws a soft
// shadow onto it, drawn as bands `px` deep from its edge, each darkening by `opacity`.
const SHADOW = { base: 0.3, wide: { px: 14, opacity: 0.2 }, near: { px: 6, opacity: 0.25 } };
const SHADOW_GONE_BY = 0.15; // share of the split: the halves have parted, the shadow under them is gone
// Where the closing blades cross, they bear on the paper: the upper one presses the top side into a dent (shadow
// bands `px` wide), the lower one lifts the other side into a ridge catching the light, with a shade beyond it.
// All are scaled by the depth of the press at each point (creaseAt).
const CREASE = {
  dent: { px: 12, opacity: 0.3 },
  dentNear: { px: 5, opacity: 0.35 },
  ridge: { from: 1, px: 3, opacity: 0.2 },
  shade: { px: 12, opacity: 0.35 },
};
const NO_EDGES = { top: '', flap: '', dim: '', wide: '', near: '' };
const NO_CREASE = { dent: '', dentNear: '', ridge: '', shade: '' };

const round = (value) => Math.round(value * 10) / 10;
const fmt = (x, y) => `${round(x)} ${round(y)}`;

const band = (inner, outer) => `M${inner.join('L')}L${outer.reverse().join('L')}Z`; // reverses `outer` in place

// The pressed paper around the cutting point ({ points, depth } from creaseAt), as fill paths.
function creaseMarks(crease) {
  if (!crease) return NO_CREASE;
  const { points, depth } = crease;
  const n = points.length;
  const [line, dent, dentNear, ridgeIn, ridgeOut, shade] = [[], [], [], [], [], []];
  const { ridge } = CREASE;
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(i - 1, 0)];
    const b = points[Math.min(i + 1, n - 1)];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    let [nx, ny] = [-(b.y - a.y) / length, (b.x - a.x) / length];
    if (ny < 0) [nx, ny] = [-nx, -ny]; // towards the strip, down the screen
    const k = depth[i];
    const { x, y } = points[i];
    const at = (d) => fmt(x + nx * d * k, y + ny * d * k);
    line.push(fmt(x, y));
    dent.push(at(-CREASE.dent.px));
    dentNear.push(at(-CREASE.dentNear.px));
    ridgeIn.push(at(ridge.from));
    ridgeOut.push(at(ridge.from + ridge.px));
    shade.push(at(ridge.from + ridge.px + CREASE.shade.px));
  }
  return {
    dent: band(line, dent),
    dentNear: band(line, dentNear),
    ridge: band(ridgeIn, [...ridgeOut]),
    shade: band(ridgeOut, shade),
  };
}

// The top edge, the strip's edge (same points, same order) and the gap between them, whole and down to each shadow band.
function edgeMarks(top, flap) {
  if (!top || top.length < 2 || flap?.length !== top.length) return NO_EDGES;
  const n = top.length;
  const [upper, lower, wide, near] = [new Array(n), new Array(n), new Array(n), new Array(n)];
  for (let i = 0; i < n; i++) {
    const { x, y } = top[i];
    const depth = Math.max(flap[i].y - y, 0);
    upper[i] = fmt(x, y);
    lower[i] = fmt(flap[i].x, flap[i].y);
    wide[n - 1 - i] = fmt(x, y + Math.min(SHADOW.wide.px, depth));
    near[n - 1 - i] = fmt(x, y + Math.min(SHADOW.near.px, depth));
  }
  const edge = upper.join('L');
  const flapEdge = lower.join('L');
  return {
    top: `M${edge}`,
    flap: `M${flapEdge}`,
    dim: `M${edge}L${lower.reverse().join('L')}Z`,
    wide: `M${edge}L${wide.join('L')}Z`,
    near: `M${edge}L${near.join('L')}Z`,
  };
}

/** Path data for the cut marks, from the hero cut's motion values (useHeroCut). */
export function useCutMarks(cut) {
  const { soFar, flapLine, crease } = cut;
  // All the marks in one pass, every point formatted once: they are redrawn on each scroll frame. flapLine follows
  // soFar on every frame of the cut, so with the crease it drives the update.
  const all = useTransform([flapLine, crease], ([flap, pressed]) => ({ ...edgeMarks(soFar.get(), flap), ...creaseMarks(pressed) }));
  return {
    top: useTransform(all, (m) => m.top),
    flap: useTransform(all, (m) => m.flap),
    dim: useTransform(all, (m) => m.dim),
    wide: useTransform(all, (m) => m.wide),
    near: useTransform(all, (m) => m.near),
    dent: useTransform(all, (m) => m.dent),
    dentNear: useTransform(all, (m) => m.dentNear),
    ridge: useTransform(all, (m) => m.ridge),
    shade: useTransform(all, (m) => m.shade),
    shadow: useTransform(cut.split, [0, SHADOW_GONE_BY], [1, 0]),
  };
}

/** Drawn with the top piece (same box and transform): its lit edge and the shadow it casts into the gap. */
export default function CutMarks({ cut, paths }) {
  return (
    <motion.div aria-hidden="true" style={{ y: cut.top.y, rotate: cut.top.rotate }} className="pointer-events-none absolute inset-0 z-10">
      <svg className="h-full w-full overflow-visible">
        <motion.g style={{ opacity: paths.shadow }} className="fill-bg">
          <motion.path d={paths.dim} fillOpacity={SHADOW.base} />
          <motion.path d={paths.wide} fillOpacity={SHADOW.wide.opacity} />
          <motion.path d={paths.near} fillOpacity={SHADOW.near.opacity} />
        </motion.g>
        <g className="fill-bg">
          <motion.path d={paths.dent} fillOpacity={CREASE.dent.opacity} />
          <motion.path d={paths.dentNear} fillOpacity={CREASE.dentNear.opacity} />
          <motion.path d={paths.shade} fillOpacity={CREASE.shade.opacity} />
        </g>
        <motion.path d={paths.ridge} fillOpacity={CREASE.ridge.opacity} className="fill-text" />
        <motion.path d={paths.top} fill="none" strokeWidth={EDGE.top.width} strokeOpacity={EDGE.top.opacity} className="stroke-text" />
      </svg>
    </motion.div>
  );
}

/** Drawn with the falling strip (inside its wrapper, outside its clip): the strip's lit edge. */
export function FlapEdge({ paths }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <motion.path d={paths.flap} fill="none" strokeWidth={EDGE.flap.width} strokeOpacity={EDGE.flap.opacity} className="stroke-text" />
    </svg>
  );
}
