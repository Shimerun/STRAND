import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EASE_REVEAL } from '../lib/motion.js';
import { prefersReducedMotion } from '../lib/scroll.js';
import { readSession, writeSession } from '../lib/session.js';
import Logo from './Logo.jsx';

const STORAGE_KEY = 'strand:intro-seen';
const FADE_S = 0.5;
const SLIDE_DELAY_S = 0.55;
const SLIDE_S = 0.65; // delay + slide = 1.2s max

export default function Intro() {
  const [visible, setVisible] = useState(() => !prefersReducedMotion() && readSession(STORAGE_KEY) !== '1');

  useEffect(() => {
    if (visible) writeSession(STORAGE_KEY, '1');
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg"
      initial={{ y: 0 }}
      animate={{ y: '-100%' }}
      transition={{ delay: SLIDE_DELAY_S, duration: SLIDE_S, ease: EASE_REVEAL }}
      onAnimationComplete={() => setVisible(false)}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: FADE_S, ease: EASE_REVEAL }}>
        <Logo className="scale-150" />
      </motion.div>
    </motion.div>
  );
}
