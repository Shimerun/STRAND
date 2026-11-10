import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useScroll, useTransform } from 'framer-motion';
import FlatShears from '../scissors/FlatShears.jsx';

const BLADE = 22; // px
const SNIP_PX = 40; // outline length per snip
const STAGGER = 0.06; // scroll share between cards of one row
const COLUMNS = 3;
const DEG = 180 / Math.PI;

// Point at distance d along the card outline, clockwise from the top-left corner; before 0 it runs along the top edge.
function onOutline(d, w, h) {
  if (d < w) return { x: d, y: 0 };
  if (d < w + h) return { x: w, y: d - w };
  if (d < 2 * w + h) return { x: w - (d - w - h), y: h };
  return { x: 0, y: Math.max(h - (d - 2 * w - h), 0) };
}

/**
 * A service card that starts as a piece of one concrete slab. As it scrolls in, small shears cut round its
 * outline; then the seam to its neighbours opens, the piece lifts with a shadow and the concrete skin falls away.
 * The plate reaches half a grid gap past the card, so neighbouring plates meet into one slab.
 */
export default function SlabCard({ index, className = '', children }) {
  const ref = useRef(null);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.3'] });
  const delay = (index % COLUMNS) * STAGGER;

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      width.set(entry.target.offsetWidth);
      height.set(entry.target.offsetHeight);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [width, height]);

  const cut = useTransform(scrollYProgress, [delay, delay + 0.55], [0, 1]);
  const plate = useTransform(scrollYProgress, [delay + 0.55, delay + 0.7], [1, 0]);
  const skin = useTransform(scrollYProgress, [delay + 0.6, delay + 0.9], [1, 0]);
  const lift = useTransform(scrollYProgress, [delay + 0.58, delay + 0.75], [0, -6]);
  const shadow = useTransform(scrollYProgress, [delay + 0.58, delay + 0.75], [0, 1]);
  const lineOpacity = useTransform(scrollYProgress, [delay + 0.8, delay + 0.95], [1, 0]);

  const dash = useTransform([cut, width, height], ([c, w, h]) => `${c * 2 * (w + h)} ${2 * (w + h)}`);
  const shears = useTransform([cut, width, height], ([c, w, h]) => {
    const d = c * 2 * (w + h);
    const tip = onOutline(d, w, h);
    const pivot = d >= BLADE ? onOutline(d - BLADE, w, h) : { x: d - BLADE, y: 0 };
    return { ...pivot, angle: 90 + Math.atan2(tip.y - pivot.y, tip.x - pivot.x) * DEG, open: 0.5 + 0.5 * Math.cos((2 * Math.PI * d) / SNIP_PX) };
  });
  const shearsX = useTransform(shears, (s) => s.x);
  const shearsY = useTransform(shears, (s) => s.y);
  const shearsAngle = useTransform(shears, (s) => s.angle); // Shears2D points up, so +90° turns it to the outline
  const shearsOpen = useTransform(shears, (s) => s.open);
  const shearsVisibility = useTransform(cut, (c) => (c > 0 && c < 1 ? 'visible' : 'hidden'));

  return (
    <li className={`relative ${className}`}>
      <motion.div aria-hidden="true" style={{ opacity: plate }} className="slab absolute -inset-2 lg:-inset-3" />
      <motion.div ref={ref} style={{ y: lift }} className="relative h-full">
        <motion.div aria-hidden="true" style={{ opacity: shadow }} className="absolute inset-0 rounded shadow-[0_18px_40px_rgba(0,0,0,0.6)]" />
        {children}
        <motion.div aria-hidden="true" style={{ opacity: skin }} className="slab pointer-events-none absolute inset-0 rounded" />
        <motion.svg aria-hidden="true" style={{ opacity: lineOpacity }} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <motion.rect width="100%" height="100%" rx="6" fill="none" strokeWidth="1.5" strokeDasharray={dash} className="stroke-text" />
        </motion.svg>
        <FlatShears x={shearsX} y={shearsY} angle={shearsAngle} open={shearsOpen} visibility={shearsVisibility} blade={BLADE} />
      </motion.div>
    </li>
  );
}
