import { motion, useReducedMotion } from 'framer-motion';
import { fadeReveal, revealViewport, textReveal } from '../lib/motion.js';

export default function Reveal({ as = 'div', children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      variants={reduce ? fadeReveal : textReveal}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      {...rest}
    >
      {children}
    </Tag>
  );
}
