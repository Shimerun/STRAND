import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll } from 'framer-motion';
import { TOP_ID } from '../lib/scroll.js';

const pad = (n) => String(n).padStart(2, '0');
const ROLL = { duration: 0.35, ease: [0.4, 0, 0.2, 1] };

/**
 * Comb-like scale on the left edge (wide screens only): ticks, a fill for how far down the page you are,
 * and the number of the section in the middle of the screen, rolling as it changes. Hidden over the hero.
 */
export default function ScrollScale() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [active, setActive] = useState(-1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const all = [...document.querySelectorAll('main section[id]')];
    const numbered = all.filter((section) => section.id !== TOP_ID);
    setTotal(numbered.length);
    // The section crossing the middle line of the viewport is the current one; the hero counts as none.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(numbered.indexOf(entry.target));
        });
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    all.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      initial={false}
      animate={{ opacity: active >= 0 ? 1 : 0 }}
      transition={ROLL}
      className="pointer-events-none fixed left-6 top-1/2 z-[38] hidden -translate-y-1/2 flex-col items-center gap-3 text-xs font-bold tabular-nums xl:flex"
    >
      <span className="relative block h-4 w-5 overflow-hidden text-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={active}
            initial={reduce ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reduce ? undefined : { y: '-100%' }}
            transition={ROLL}
            className="absolute inset-0"
          >
            {pad(Math.max(active + 1, 1))}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative block h-[40vh] w-3">
        <span className="comb-ticks absolute inset-0" />
        <motion.span style={{ scaleY: scrollYProgress }} className="absolute left-0 top-0 h-full w-px origin-top bg-text" />
      </span>
      <span className="text-concrete">{pad(total)}</span>
    </motion.div>
  );
}
