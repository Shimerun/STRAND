import { motion } from 'framer-motion';
import { fadeReveal, revealViewport, textReveal } from '../lib/motion.js';
import { usePrefersReducedMotion } from '../lib/useMediaQuery.js';

// index: position in a list, used to stagger items of the same row.
export default function Reveal({ as = 'div', index = 0, ...rest }) {
  const reduce = usePrefersReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      variants={reduce ? fadeReveal : textReveal}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      {...rest}
    />
  );
}
