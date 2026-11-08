import { motion, useTransform } from 'framer-motion';
import { cutPath } from '../../lib/heroCut.js';

const GUIDE_OPACITY = 0.55;
const GUIDE_DASH = '8 6';
const SLIT = { core: 3, edges: 5, edgeOpacity: 0.55 }; // px stroke widths

// Along the wavy cut line: a dashed "cut here" guide that shows up as the shears take aim, and the slit
// itself, a dark gap with lit edges from the right edge to where the blades last closed.
export default function CutMarks({ cut }) {
  const { geometry, state, aim, split } = cut;
  const path = useTransform(geometry, (g) => (g ? cutPath(g) : ''));
  const dash = useTransform([state, geometry], ([s, g]) => (s && g ? `${s.cut} ${g.total + SLIT.edges}` : '0 1'));
  const guideOpacity = useTransform([aim, split], ([a, s]) => GUIDE_OPACITY * a * (1 - Math.min(s * 4, 1)));
  const slitOpacity = useTransform(split, [0, 0.3], [1, 0]);

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
      <motion.path d={path} fill="none" strokeWidth={1} strokeDasharray={GUIDE_DASH} className="stroke-text" style={{ opacity: guideOpacity }} />
      <motion.g style={{ opacity: slitOpacity }}>
        <motion.path d={path} fill="none" strokeWidth={SLIT.edges} strokeOpacity={SLIT.edgeOpacity} strokeDasharray={dash} className="stroke-text" />
        <motion.path d={path} fill="none" strokeWidth={SLIT.core} strokeDasharray={dash} className="stroke-bg" />
      </motion.g>
    </svg>
  );
}
