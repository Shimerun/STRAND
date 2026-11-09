import { motion, useTransform } from 'framer-motion';
import { cutPath } from '../../lib/heroCut.js';

const GUIDE_OPACITY = 0.55;
const GUIDE_DASH = '8 6';
// px: the top piece's edge throws a shadow onto the sagging flap, growing to `width` over `ramp` px behind the blades.
const SHADE = { width: 8, ramp: 160, opacity: 0.4 };
const EDGE_OPACITY = 0.45;
const FADE_BY = 0.1; // share of the split: the marks are gone before the parting halves leave them behind
const EMPTY = { shade: '', edge: '' };

const fmt = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// Along the cut so far (cutting order, the cutting point last): the lit edge of the top piece on the line, and
// the shadow it throws onto the flap, whose edge has sagged by `tan` px per px from the cutting point.
function cutOutlines(points, tan) {
  const n = points.length;
  if (n < 2) return EMPTY;
  const hinge = points[n - 1];
  const back = new Array(n).fill(0); // distance back from the cutting point
  for (let i = n - 2; i >= 0; i--) back[i] = back[i + 1] + Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);

  const lower = [];
  const shadow = [];
  points.forEach((point, i) => {
    const a = points[Math.max(i - 1, 0)];
    const b = points[Math.min(i + 1, n - 1)];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    let nx = -(b.y - a.y) / length;
    let ny = (b.x - a.x) / length;
    if (ny < 0) [nx, ny] = [-nx, -ny]; // normal towards the flap, down the screen
    const y = point.y + (point.x - hinge.x) * tan;
    const width = SHADE.width * Math.min(back[i] / SHADE.ramp, 1);
    lower.push(fmt(point.x, y));
    shadow.push(fmt(point.x + nx * width, y + ny * width));
  });

  return {
    shade: `M${lower.join('L')}L${[...shadow].reverse().join('L')}Z`,
    edge: `M${points.map((point) => fmt(point.x, point.y)).join('L')}`,
  };
}

// Along the wavy cut line: a dashed "cut here" guide that shows up as the shears take aim, and along the cut
// itself the lit edge of the top piece and its shadow on the sagging flap (the gap between them is see-through).
export default function CutMarks({ cut }) {
  const { geometry, soFar, sag, aim, split } = cut;
  const path = useTransform(geometry, (g) => (g ? cutPath(g) : ''));
  const outlines = useTransform([soFar, sag], ([points, tan]) => (points ? cutOutlines(points, tan) : EMPTY));
  const shade = useTransform(outlines, (o) => o.shade);
  const edge = useTransform(outlines, (o) => o.edge);
  const guideOpacity = useTransform([aim, split], ([a, s]) => GUIDE_OPACITY * a * (1 - Math.min(s * 4, 1)));
  const cutOpacity = useTransform(split, [0, FADE_BY], [1, 0]);

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
      <motion.path d={path} fill="none" strokeWidth={1} strokeDasharray={GUIDE_DASH} className="stroke-text" style={{ opacity: guideOpacity }} />
      <motion.g style={{ opacity: cutOpacity }}>
        <motion.path d={shade} className="fill-bg" fillOpacity={SHADE.opacity} />
        <motion.path d={edge} fill="none" strokeWidth={1} strokeOpacity={EDGE_OPACITY} className="stroke-text" />
      </motion.g>
    </svg>
  );
}
