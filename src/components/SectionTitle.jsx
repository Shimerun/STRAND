import { Fragment, useRef } from 'react';
import { motion, useReducedMotion, useScroll } from 'framer-motion';
import { maskWord, maskWords, revealViewport } from '../lib/motion.js';
import { useScrollWeight } from '../lib/scrollWeight.js';
import Reveal from './Reveal.jsx';

// The hairline is drawn by the scroll while the title travels from the bottom edge to 60% of the screen.
const LINE_OFFSET = ['start end', 'start 0.6'];
const H2 = 'text-[1.75rem] leading-tight sm:text-4xl';
const H2_WEIGHT = 800; // font-extrabold, the h2 base style

/**
 * The real text is in the flow but transparent: it sizes the title and is what screen readers, search and
 * selection get. The words seen sit in a layer on top, each rising out of its own mask, and thin out while the
 * page scrolls fast (useScrollWeight). The layer is laid out on its own (contain), so a change of weight never
 * re-lays out the section around the title.
 */
function MaskedWords({ text }) {
  const layerRef = useRef(null);
  useScrollWeight(layerRef, H2_WEIGHT);

  return (
    <motion.h2 variants={maskWords} initial="hidden" whileInView="visible" viewport={revealViewport} className={`relative ${H2}`}>
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
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: LINE_OFFSET });

  return (
    <div ref={ref} className={className}>
      <Reveal
        aria-hidden="true"
        className="section-index mb-4 flex items-center gap-3 text-xs font-medium tracking-heading text-concrete"
      >
        <motion.span style={reduce ? undefined : { scaleX: scrollYProgress }} className="h-px w-16 origin-left bg-concrete/50 md:w-24" />
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
