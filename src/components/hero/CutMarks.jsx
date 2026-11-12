import { motion, useTransform } from 'framer-motion';

// The cut edges show the paper's core: a hairline along the top piece, which lies flat, and a thicker line along
// the strip, whose edge is seen face-on as it bends away.
const EDGE = { top: { width: 1, opacity: 0.5 }, flap: { width: 1.75, opacity: 0.75 } };
const FADE_BY = 0.1; // share of the split: the marks are gone before the parting halves leave them behind

const fmt = ({ x, y }) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const path = (points) => (points?.length > 1 ? `M${points.map(fmt).join('L')}` : '');

/** Along the cut so far: the edge of the top piece on the line, and the strip's edge where the sag has taken it. */
export default function CutMarks({ cut }) {
  const { soFar, flapEdge, sag, split } = cut;
  const top = useTransform(soFar, path);
  const flap = useTransform([flapEdge, sag], ([points, tan]) => {
    if (!points?.length) return '';
    const hinge = points[points.length - 1];
    return path(points.map(({ x, y }) => ({ x, y: y + (x - hinge.x) * tan })));
  });
  const opacity = useTransform(split, [0, FADE_BY], [1, 0]);

  return (
    <motion.svg aria-hidden="true" style={{ opacity }} className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
      <motion.path d={top} fill="none" strokeWidth={EDGE.top.width} strokeOpacity={EDGE.top.opacity} className="stroke-text" />
      <motion.path d={flap} fill="none" strokeWidth={EDGE.flap.width} strokeOpacity={EDGE.flap.opacity} className="stroke-text" />
    </motion.svg>
  );
}
