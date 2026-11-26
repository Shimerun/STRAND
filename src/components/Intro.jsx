import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EASE_REVEAL } from '../lib/motion.js';
import { prefersReducedMotion } from '../lib/scroll.js';
import { readSession, writeSession } from '../lib/session.js';

const STORAGE_KEY = 'strand:intro-seen';
// The logo fades in, then slides up into place: under a second, once per session.
const ACCENT = { y: [10, 10, 0], opacity: [0, 1, 1], times: [0, 0.45, 1], duration: 0.9 };

/**
 * The opening accent, on the header's logo only: the first screen is readable and its booking button usable from
 * the first frame (a full-screen cover used to hide them for 1.2 s). children: the logo.
 */
export default function Intro({ children }) {
  const [play] = useState(() => !prefersReducedMotion() && readSession(STORAGE_KEY) !== '1');

  useEffect(() => {
    if (play) writeSession(STORAGE_KEY, '1');
  }, [play]);

  if (!play) return children;
  const { times, duration, ...keyframes } = ACCENT;
  return (
    <motion.span
      className="inline-flex"
      initial={{ opacity: keyframes.opacity[0], y: keyframes.y[0] }}
      animate={keyframes}
      transition={{ duration, times, ease: EASE_REVEAL }}
    >
      {children}
    </motion.span>
  );
}
