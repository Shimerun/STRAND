import { motion, useTransform } from 'framer-motion';
import { clamp01, cutGeometry, ease, pointAt } from '../../lib/heroCut.js';

// Slivers trimmed off along the cut spring off it as the halves part: each runs on along the line, away from the
// middle (where the paper opens first), shaken off the edge above or below it, and is gone before the section under
// the cut shows its text. at: share of the line (from the right edge) at its middle; len: px along the line on a
// wide screen (less on a narrow one); px: thickness at the middle; off: px it leaves the line by (+ down).
const SLIVERS = [
  { at: 0.1, len: 70, px: 3, off: -16 },
  { at: 0.25, len: 44, px: 2, off: 20 },
  { at: 0.4, len: 84, px: 3, off: -12 },
  { at: 0.6, len: 52, px: 2, off: 18 },
  { at: 0.75, len: 76, px: 3, off: -20 },
  { at: 0.9, len: 40, px: 2, off: 14 },
];
// end: share of the flight by which they are gone; travel: share of the screen width they run on; grow: how much
// bigger they get on the way (they come a little towards the viewer); peak: most opacity.
const FLY = { end: 0.3, travel: 0.12, grow: 0.5, peak: 0.75 };
const STEPS = 10;
const WIDE_PX = 1440;
const PAD = 4; // px round the sliver's outline

// Box (frame px), outline (box px) and the way it flies (unit vector along the line, away from the middle).
function sliverShape(spec, width, height) {
  const geometry = cutGeometry(width, height);
  const half = (spec.len * Math.min(Math.max(width / WIDE_PX, 0.45), 1)) / 2;
  const middle = spec.at * geometry.total;
  const top = [];
  const bottom = [];
  for (let i = 0; i <= STEPS; i++) {
    const { x, y } = pointAt(geometry, middle - half + (2 * half * i) / STEPS);
    const t = (spec.px / 2) * Math.sin((Math.PI * i) / STEPS);
    top.push({ x, y: y - t });
    bottom.push({ x, y: y + t });
  }
  const all = [...top, ...bottom];
  const left = Math.min(...all.map((p) => p.x)) - PAD;
  const up = Math.min(...all.map((p) => p.y)) - PAD;
  const box = { left, top: up, width: Math.max(...all.map((p) => p.x)) - left + PAD, height: Math.max(...all.map((p) => p.y)) - up + PAD };
  const outline = [...top, ...bottom.reverse()].map((p) => `${(p.x - left).toFixed(1)}px ${(p.y - up).toFixed(1)}px`);
  // The line runs right to left: its own direction leads leftwards, so a sliver right of the middle goes the other way.
  const a = top[0];
  const b = top[STEPS];
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const away = (a.x + b.x) / 2 < width / 2 ? 1 : -1;
  return { box, clip: `polygon(${outline.join(', ')})`, dir: { x: (away * (b.x - a.x)) / length, y: (away * (b.y - a.y)) / length } };
}

function Sliver({ spec, cut }) {
  const { width, height } = cut.size;
  const shape = useTransform([width, height], ([w, h]) => (w ? sliverShape(spec, w, h) : null));
  const run = useTransform(cut.split, (s) => clamp01(s / FLY.end)); // 0..1 over its flight
  const away = useTransform([run, width], ([r, w]) => (1 - (1 - r) ** 2) * FLY.travel * w); // ease-out
  const opacity = useTransform(run, (r) => (r > 0 && r < 1 ? FLY.peak * clamp01(r / 0.15) * (1 - ease(clamp01((r - 0.4) / 0.6))) : 0));

  return (
    <motion.div
      style={{
        left: useTransform(shape, (s) => s?.box.left ?? 0),
        top: useTransform(shape, (s) => s?.box.top ?? 0),
        width: useTransform(shape, (s) => s?.box.width ?? 0),
        height: useTransform(shape, (s) => s?.box.height ?? 0),
        clipPath: useTransform(shape, (s) => s?.clip ?? 'none'),
        x: useTransform([away, shape], ([d, s]) => (s ? s.dir.x * d : 0)),
        y: useTransform([away, shape, run], ([d, s, r]) => (s ? s.dir.y * d + spec.off * (1 - (1 - r) ** 2) : 0)),
        scale: useTransform(run, (r) => 1 + FLY.grow * r),
        opacity,
        visibility: useTransform(opacity, (o) => (o > 0 ? 'visible' : 'hidden')),
      }}
      className="absolute bg-text will-change-transform"
    />
  );
}

/** The slivers of the cut springing off it as the camera sets off through it (Hero.jsx). Decorative. */
export default function CutSlivers({ cut }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      {SLIVERS.map((spec) => (
        <Sliver key={spec.at} spec={spec} cut={cut} />
      ))}
    </div>
  );
}
