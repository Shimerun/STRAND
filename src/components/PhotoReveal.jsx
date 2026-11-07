import { useRef } from 'react';
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { fadeReveal, revealViewport } from '../lib/motion.js';
import Img from './Img.jsx';

// Horizontal inset (%) on each side before the photo opens to full width.
const CLIP_START = 30;

const fadeProps = { variants: fadeReveal, initial: 'hidden', whileInView: 'visible', viewport: revealViewport };

export default function PhotoReveal({ className = '', ...imgProps }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const inset = useTransform(scrollYProgress, [0, 1], [CLIP_START, 0]);
  const clipPath = useMotionTemplate`inset(0% ${inset}%)`;

  return (
    <motion.div
      ref={ref}
      className={`overflow-hidden ${className}`}
      style={reduce ? undefined : { clipPath }}
      {...(reduce ? fadeProps : undefined)}
    >
      <Img {...imgProps} className="h-full w-full object-cover" />
    </motion.div>
  );
}
