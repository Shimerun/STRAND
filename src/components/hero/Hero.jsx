import { useRef } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { HERO_CUT } from '../../lib/heroCut.js';
import { TOP_ID } from '../../lib/scroll.js';
import CutDebris from './CutDebris.jsx';
import CutMarks from './CutMarks.jsx';
import HeroContent from './HeroContent.jsx';
import ScrollCue from './ScrollCue.jsx';
import { useHeroCut } from './useHeroCut.js';
import { useSnipJolt } from './useSnipJolt.js';

const CUE_GONE_AT = 0.5; // share of the aim: the scroll cue has faded out
// The scroll the hero stays pinned for. Used twice: as the hero's own scroll room, and after the underlay.
const PIN_ROOM = {
  className: 'h-[calc(var(--pin)*100svh)] lg:h-[calc(var(--pin-lg)*100svh)]',
  style: { '--pin': HERO_CUT.pin.mobile, '--pin-lg': HERO_CUT.pin.desktop },
};

/**
 * First screen. While it is pinned, the shears cut it along a wavy line (src/lib/heroCut.js): the cut-off
 * flap (a duplicate clipped below the line) sags from the cutting point, opening a gap onto the underlay;
 * once the cut is through the halves fly apart while the underlay grows to full size.
 * children: the content that follows the hero and shows through the cut (the underlay).
 * Reduced motion: no pin, no cut, no parallax; the children simply follow.
 */
export default function Hero({ children }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const underlayRef = useRef(null);
  const cut = useHeroCut(sectionRef, frameRef, underlayRef, !reduce);
  const jolt = useSnipJolt(cut.state);
  const cueOpacity = useTransform(cut.aim, [0, CUE_GONE_AT], [1, 0]);

  if (reduce) {
    return (
      <>
        <section ref={sectionRef} id={TOP_ID} className="relative">
          <div ref={frameRef} data-hero-frame>
            <HeroContent />
            <ScrollCue />
          </div>
        </section>
        {children}
      </>
    );
  }

  const { top, flap, parallaxY } = cut;

  return (
    <>
      {/* z-10 keeps the pinned frame over the underlay; the section itself lets clicks through so its empty
          scroll room never blocks what lies beneath. */}
      <section ref={sectionRef} id={TOP_ID} className="pointer-events-none relative z-10">
        <motion.div
          ref={frameRef}
          data-hero-frame
          style={{ visibility: cut.frameVisibility }}
          className="pointer-events-auto sticky top-0 overflow-hidden"
        >
          {/* will-change: each piece gets its own layer, so the per-frame clip path re-masks it on the GPU
              instead of repainting the photo (Safari repainted the whole screen on every scroll frame). */}
          <motion.div
            style={{ y: jolt, scale: cut.swell, originX: cut.origin.x, originY: cut.origin.y }}
            className="relative will-change-transform"
          >
            <motion.div style={{ y: top.y, rotate: top.rotate, clipPath: top.clip }} className="relative will-change-transform">
              <HeroContent parallaxY={parallaxY} />
            </motion.div>

            <motion.div
              aria-hidden="true"
              style={{
                y: flap.y,
                rotate: flap.rotate,
                skewY: flap.skewY,
                originX: flap.originX,
                originY: flap.originY,
                clipPath: flap.clip,
                visibility: flap.visibility,
              }}
              className="absolute inset-0 will-change-transform"
            >
              <HeroContent parallaxY={parallaxY} copy />
            </motion.div>

            <CutMarks cut={cut} />
          </motion.div>

          <CutDebris state={cut.state} />
          <ScrollCue opacity={cueOpacity} />
        </motion.div>
        {/* Scroll room for the pin; inside the section so the sticky frame stays put over it. */}
        <div aria-hidden="true" {...PIN_ROOM} />
      </section>

      {/* The underlay. Its box is pulled up to the top of the hero (useHeroCut) and is one pin taller than the
          content, so the content sticks to the top of the screen for exactly the pin and then scrolls on from
          its own place. CSS holds it there: a scripted position trails a touch scroll by a frame, and the
          text seen through the cut shook. */}
      <div data-hero-underlay>
        <div ref={underlayRef} className="sticky top-0">
          {children}
        </div>
        <div aria-hidden="true" {...PIN_ROOM} />
      </div>
    </>
  );
}
