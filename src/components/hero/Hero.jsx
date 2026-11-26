import { useRef } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { site } from '../../data/site.js';
import { HERO_CUT } from '../../lib/heroCut.js';
import { TOP_ID, scrollToId } from '../../lib/scroll.js';
import CutDebris from './CutDebris.jsx';
import CutMarks, { FlapEdge, useCutMarks } from './CutMarks.jsx';
import CutSlivers from './CutSlivers.jsx';
import HeroContent from './HeroContent.jsx';
import { PortalCamera } from './portalPlanes.js';
import ScrollCue from './ScrollCue.jsx';
import { useHeroCut } from './useHeroCut.js';
import { useSnipJolt } from './useSnipJolt.js';

const CUE_GONE_AT = 0.5; // share of the aim: the scroll cue has faded out
const SKIP_GONE_AT = 0.25; // share of the flight: past this there is little left to skip
const FALL_ORIGIN_Y = '75%'; // the strip turns about its middle as it falls
const FLAP_SHADE = 'linear-gradient(90deg, transparent 30%, rgb(10 10 10 / 0.5))'; // bg token, see tailwind.config
const CTA_AWAY = 10_000; // px, far below the frame, whose overflow clips it: off screen for the mobile bar
// The scroll the hero stays pinned for. Used twice: as the hero's own scroll room, and after the underlay.
const PIN_ROOM = {
  className: 'h-[calc(var(--pin)*100svh)] lg:h-[calc(var(--pin-lg)*100svh)]',
  style: { '--pin': HERO_CUT.pin.mobile, '--pin-lg': HERO_CUT.pin.desktop },
};

/**
 * First screen. While it is pinned, the shears cut it along a wavy line (src/lib/heroCut.js): the cut-off
 * flap (a duplicate clipped below the line) sags from the cutting point, opening a gap onto the underlay;
 * once the cut is through, one camera flies through it (PORTAL): the halves swing apart and swell past the viewer,
 * slivers spring off the cut, and the underlay's planes (data-portal) come in at their own depths to land in place.
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
  const skipOpacity = useTransform(cut.split, [0, SKIP_GONE_AT], [1, 0]);
  const skipVisibility = useTransform(skipOpacity, (o) => (o > 0 ? 'visible' : 'hidden'));
  const ctaY = useTransform(cut.split, (s) => (s > 0 ? CTA_AWAY : 0));
  const paths = useCutMarks(cut);
  // Straight to the section under the cut, keyboard focus with it.
  const skip = () => {
    const id = underlayRef.current?.querySelector('section[id]')?.id;
    if (id) scrollToId(id, { immediate: true });
  };

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
          {/* Stands in for the buttons (data-own-cta) until the cut is through and the strip carrying them falls,
              so the mobile bar comes up as they go. */}
          <motion.div aria-hidden="true" data-own-cta style={{ y: ctaY }} className="pointer-events-none absolute inset-0" />
          {/* will-change: each piece gets its own layer, so the per-frame clip path re-masks it on the GPU
              instead of repainting the photo (Safari repainted the whole screen on every scroll frame). */}
          <motion.div
            style={{ y: jolt, scale: cut.swell, originX: cut.origin.x, originY: cut.origin.y }}
            className="relative will-change-transform"
          >
            <motion.div style={top.motion} className="relative will-change-transform">
              <motion.div style={{ clipPath: top.clip }} className="will-change-transform">
                <HeroContent parallaxY={parallaxY} ownCta={false} />
              </motion.div>
            </motion.div>

            {/* The cut-off strip: the wrapper carries its fall, the inner piece its sag and fold about the cutting
                point. */}
            <motion.div
              aria-hidden="true"
              style={{ ...flap.fall, originX: '50%', originY: FALL_ORIGIN_Y, visibility: flap.visibility }}
              className="absolute inset-0 will-change-transform"
            >
              <motion.div
                style={{ transform: flap.transform, transformOrigin: flap.origin, clipPath: flap.clip }}
                className="absolute inset-0 will-change-transform"
              >
                <HeroContent parallaxY={parallaxY} copy ownCta={false} />
                {/* Shade over the strip, darker the further it lifts; only its opacity moves, on its own
                    layer so the strip is not repainted. */}
                <motion.div
                  aria-hidden="true"
                  style={{ opacity: flap.shade, backgroundImage: FLAP_SHADE, willChange: 'opacity' }}
                  className="absolute inset-0"
                />
              </motion.div>
              <FlapEdge paths={paths} />
            </motion.div>

            <CutMarks cut={cut} paths={paths} />
          </motion.div>

          <CutSlivers cut={cut} />
          <CutDebris state={cut.state} />
          <ScrollCue opacity={cueOpacity} />
          <motion.button
            type="button"
            onClick={skip}
            style={{ opacity: skipOpacity, visibility: skipVisibility }}
            className="absolute right-3 top-[calc(theme(spacing.header)+0.25rem)] z-20 flex min-h-11 items-center rounded px-2 text-xs font-medium uppercase tracking-heading text-text/70 transition-colors duration-300 hover:text-text lg:bottom-7 lg:right-[calc(var(--gutter)+0.5rem)] lg:top-auto"
          >
            {site.ui.cta.skipIntro}
          </motion.button>
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
          <PortalCamera.Provider value={cut.camera}>{children}</PortalCamera.Provider>
        </div>
        <div aria-hidden="true" {...PIN_ROOM} />
      </div>
    </>
  );
}
