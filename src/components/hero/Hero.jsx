import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HERO_CUT } from '../../lib/heroCut.js';
import { TOP_ID } from '../../lib/scroll.js';
import CutDebris from './CutDebris.jsx';
import CutMarks from './CutMarks.jsx';
import HeroContent from './HeroContent.jsx';
import { useHeroCut } from './useHeroCut.js';

/**
 * First screen. While it is pinned, the shears cut it along a wavy line (src/lib/heroCut.js): the cut-off
 * flap (a duplicate clipped below the line) sags from the cutting point; once the cut is through both halves
 * swell and part while the next section shows through the gap. Reduced motion: no pin, no cut, no parallax.
 */
export default function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const cut = useHeroCut(sectionRef, frameRef, !reduce);

  if (reduce) {
    return (
      <section ref={sectionRef} id={TOP_ID} className="relative">
        <div ref={frameRef} data-hero-frame>
          <HeroContent />
        </div>
      </section>
    );
  }

  const { top, flap, parallaxY } = cut;

  return (
    // z-10 keeps the pinned frame over the next section, which is pulled up beneath it; the section itself
    // lets clicks through so its empty scroll room never blocks that section.
    <section ref={sectionRef} id={TOP_ID} className="pointer-events-none relative z-10">
      <motion.div
        ref={frameRef}
        data-hero-frame
        style={{ visibility: cut.frameVisibility }}
        className="pointer-events-auto sticky top-0 overflow-hidden"
      >
        <motion.div aria-hidden="true" style={{ opacity: cut.backdrop }} className="absolute inset-0 bg-bg" />

        <motion.div style={{ scale: cut.swell, originX: cut.origin.x, originY: cut.origin.y, opacity: cut.opacity }} className="relative">
          <motion.div style={{ y: top.y, rotate: top.rotate, clipPath: top.clip }} className="relative">
            <HeroContent parallaxY={parallaxY} />
          </motion.div>

          <motion.div
            aria-hidden="true"
            inert=""
            style={{ y: flap.y, rotate: flap.rotate, originX: flap.originX, originY: flap.originY, clipPath: flap.clip, visibility: flap.visibility }}
            className="absolute inset-0"
          >
            <HeroContent parallaxY={parallaxY} copy />
          </motion.div>

          <CutMarks cut={cut} />
        </motion.div>

        <CutDebris state={cut.state} />
      </motion.div>
      {/* Scroll room for the pin; inside the section so the sticky frame stays put over it. */}
      <div aria-hidden="true" style={{ height: `${HERO_CUT.pin * 100}svh` }} />
    </section>
  );
}
