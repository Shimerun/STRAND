import { Fragment, useContext, useEffect, useRef } from 'react';
import { motion, useAnimationControls, useScroll } from 'framer-motion';
import { PORTAL } from '../lib/heroCut.js';
import { maskWord, maskWords, revealViewport } from '../lib/motion.js';
import { useScrollWeight } from '../lib/scrollWeight.js';
import { PortalCamera } from './hero/portalPlanes.js';
import Reveal from './Reveal.jsx';
import { usePrefersReducedMotion } from '../lib/useMediaQuery.js';

// The hairline is drawn by the scroll while the title travels from the bottom edge to 60% of the screen.
const LINE_OFFSET = ['start end', 'start 0.6'];
const H2 = 'text-[1.75rem] leading-tight sm:text-4xl';
const H2_WEIGHT = 800; // font-extrabold, the h2 base style

// The real text stays in the flow, transparent: it sizes the title and is what screen readers, search and
// selection get. The visible words sit in a layer on top, each rising out of its own mask and thinning with
// scroll speed; contain keeps a weight change from re-laying out the section.
function MaskedWords({ text }) {
  const layerRef = useRef(null);
  // Under the hero cut the section is on screen (beneath the hero) from the start, so in view says nothing: the
  // words rise as the flight through the cut lands instead, once; already landed (a jump to it): in place at once.
  const camera = useContext(PortalCamera);
  const controls = useAnimationControls();
  useScrollWeight(layerRef, H2_WEIGHT);
  useEffect(() => {
    if (!camera) return undefined;
    // A flag, not an unsubscribe: leaving mid-notify makes the value skip the next listener (the flight's own).
    let landed = false;
    const land = (c) => {
      if (landed || c < PORTAL.title) return;
      landed = true;
      if (c < 1) controls.start('visible');
      else controls.set('visible');
    };
    land(camera.get());
    return camera.on('change', land);
  }, [camera, controls]);
  const reveal = camera ? { animate: controls } : { whileInView: 'visible', viewport: revealViewport };

  return (
    <motion.h2 variants={maskWords} initial="hidden" {...reveal} className={`relative ${H2}`}>
      <span className="text-transparent">{text}</span>
      <span ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 select-none [contain:layout_size]">
        {text.split(' ').map((word, index) => (
          <Fragment key={index}>
            {index > 0 && ' '}
            {/* The padding gives Й and the tails of Д, Ц, Щ room inside the mask. */}
            <span className="-my-[0.12em] inline-block overflow-hidden py-[0.12em] align-top">
              <motion.span variants={maskWord} className="inline-block">
                {word}
              </motion.span>
            </span>
          </Fragment>
        ))}
      </span>
    </motion.h2>
  );
}

// The number above the title is a CSS counter (index.css), so sections stay numbered in page order.
export default function SectionTitle({ className = '', children }) {
  const reduce = usePrefersReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: LINE_OFFSET });

  return (
    <div ref={ref} className={className}>
      <Reveal
        aria-hidden="true"
        className="section-index mb-4 flex items-center gap-3 text-xs font-medium tracking-heading text-concrete"
      >
        {/* Its own layer: the scroll-linked scale would otherwise repaint the page around it every frame. */}
        <motion.span style={reduce ? undefined : { scaleX: scrollYProgress }} className="h-px w-16 origin-left bg-concrete/50 will-change-transform md:w-24" />
      </Reveal>
      {reduce || typeof children !== 'string' ? (
        <Reveal as="h2" className={H2}>
          {children}
        </Reveal>
      ) : (
        <MaskedWords text={children} />
      )}
    </div>
  );
}
