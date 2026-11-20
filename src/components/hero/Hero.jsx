import { useRef } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { HERO_CUT } from '../../lib/heroCut.js';
import { TOP_ID } from '../../lib/scroll.js';
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
 * First screen. While it is pinned (src/lib/heroCut.js) the shears snip the photo's right edge once, then the
 * photo slides off to the left and the section that follows (the underlay, `children`) slides in from the right
 * into its own place; the page scrolls on from there. Native scroll drives it all, so touch, keyboard and the
 * scrollbar work as usual, and a link to the next section lands where it rests.
 * Reduced motion: no pin, snip or parallax; the children simply follow.
 */
export default function Hero({ children }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const underlayRef = useRef(null);
  const cut = useHeroCut(sectionRef, frameRef, underlayRef, !reduce);
  const jolt = useSnipJolt(cut.snipped);
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

  return (
    <>
      {/* z-10 keeps the pinned frame over the underlay. Only the photo takes clicks: the section's empty scroll
          room and the frame around the sliding photo let them through to the section it uncovers. */}
      <section ref={sectionRef} id={TOP_ID} className="pointer-events-none relative z-10">
        <motion.div ref={frameRef} data-hero-frame style={{ visibility: cut.frameVisibility }} className="sticky top-0 overflow-hidden">
          {/* will-change: the photo slides on its own layer instead of repainting the screen each frame. */}
          <motion.div style={{ x: cut.slideX, y: jolt }} className="pointer-events-auto relative will-change-transform">
            <HeroContent parallaxY={cut.parallaxY} />
            {/* The fresh cut along the right edge: a lit edge, and a shadow on the section it uncovers. */}
            <motion.div
              aria-hidden="true"
              style={{ opacity: cut.edge }}
              className="pointer-events-none absolute inset-y-0 right-0 w-px bg-text/60 shadow-[16px_0_40px_rgb(0_0_0/0.6)]"
            />
          </motion.div>
          <ScrollCue opacity={cueOpacity} />
        </motion.div>
        {/* Scroll room for the pin; inside the section so the sticky frame stays put over it. */}
        <div aria-hidden="true" {...PIN_ROOM} />
      </section>

      {/* The underlay. Its box is pulled up to the top of the hero (useHeroCut) and is one pin taller than the
          content, so the content sticks to the top of the screen for exactly the pin and then scrolls on from
          its own place. CSS holds it there: a scripted position trails a touch scroll by a frame. */}
      <div data-hero-underlay>
        <div ref={underlayRef} className="sticky top-0">
          {children}
        </div>
        <div aria-hidden="true" {...PIN_ROOM} />
      </div>
    </>
  );
}
