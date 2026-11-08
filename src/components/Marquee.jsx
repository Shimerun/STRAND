import { Fragment, useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useVelocity } from 'framer-motion';
import { site } from '../data/site.js';

const WORDS = [site.name, site.ui.brand.sub, site.city];
const COPIES = 3; // enough to cover any screen while one copy scrolls out
const SPEED = 50; // px/s at rest
const BOOST = 0.004; // extra speed factor per px/s of scroll
const MAX_FACTOR = 7;

function ScissorsMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="h-8 w-8 shrink-0 text-concrete md:h-14 md:w-14">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.6 7.6 20 18M8.6 16.4 20 6" />
    </svg>
  );
}

/**
 * Brand words running across the page between sections. They speed up with the scroll and turn round
 * when it does. Decorative (aria-hidden); still under reduced motion and paused while off screen.
 */
export default function Marquee() {
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const copyRef = useRef(null);
  const copyWidth = useRef(1);
  const offset = useRef(0);
  const direction = useRef(1);
  const [inView, setInView] = useState(false);
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useEffect(() => {
    const resizer = new ResizeObserver(() => {
      copyWidth.current = copyRef.current?.offsetWidth || 1;
    });
    resizer.observe(copyRef.current);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(rootRef.current);
    return () => {
      resizer.disconnect();
      observer.disconnect();
    };
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduce || !inView) return;
    const v = velocity.get();
    if (Math.abs(v) > 1) direction.current = Math.sign(v);
    const factor = Math.min(1 + Math.abs(v) * BOOST, MAX_FACTOR);
    const width = copyWidth.current;
    offset.current = (offset.current + (direction.current * SPEED * factor * delta) / 1000) % width;
    x.set(-((offset.current + width) % width));
  });

  return (
    <div ref={rootRef} aria-hidden="true" className="overflow-hidden border-y border-line py-6 md:py-10">
      <motion.div style={{ x }} className="flex w-max">
        {Array.from({ length: COPIES }, (_, copy) => (
          <div key={copy} ref={copy === 0 ? copyRef : undefined} className="flex shrink-0 items-center">
            {WORDS.map((word, i) => (
              <Fragment key={word}>
                <span className={`px-6 text-5xl font-extrabold uppercase leading-none tracking-heading md:px-10 md:text-8xl ${i % 2 ? 'marquee-outline' : ''}`}>
                  {word}
                </span>
                <ScissorsMark />
              </Fragment>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
