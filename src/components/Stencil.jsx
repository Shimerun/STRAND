import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { site } from '../data/site.js';
import { clamp01, ease } from '../lib/heroCut.js';
import { setScene } from './scissors/rig.js';
import StencilBand, { BAND, VIEW, shearsAt } from './StencilBand.jsx';

const WORD = site.name.toUpperCase();
// The pinned stage in screen heights: its height, and the extra scroll it is held for while the band is cut. Phones
// get a lower stage and a shorter pin: the word is small there, and a full screen held over two screens of
// scrolling was mostly black. The lower stage also lets the footer rise under the scene as it ends.
// shears: their size as a share of the rig's track length, a big pair laid along the cut.
const STAGE = { full: { height: 1, pin: 2, shears: 1.4 }, compact: { height: 0.7, pin: 1, shears: 1.1 } };
const COMPACT = '(max-width: 767px)';
// The shears come over from their track while the stage rises to its pin (its top from this share of the screen).
// From 0.35 they crossed the screen 5-10x faster than the page moved (wheel recording, 2026-11-17).
const ARRIVE = ['start 0.9', 'start start'];
// Shares of the pin. The cut is about as long as the scroll that drives it, so the two are tied 1:1.
const CUT_RANGE = [0.04, 0.6]; // the shears cut the band off
const DROP_RANGE = [0.6, 0.9]; // the band falls away
// Late in the drop: what stands under the word comes in.
const CLOSING_RANGE = [0.78, 0.95];
const CLOSING_AWAY = 10_000; // px, far below the screen; the track's overflow-clip keeps the page from growing
const LEAVE = 0.6; // share of the drop over which the shears go back to their track (0.2 threw them across)
const WORD_PROPS = {
  x: (VIEW.width - 960) / 2,
  y: 192,
  fontSize: 205,
  fontWeight: 800,
  textLength: 960,
  lengthAdjust: 'spacing',
};
const span = (value, [from, to]) => clamp01((value - from) / (to - from));

/**
 * Footer finale: the name stands in white under a band of paper; the site's shears (borrowed from the rig, laid
 * along the cut) cut the band off in one straight pass along its top edge, tied to the scroll. The freed part sags
 * and uncovers the word, then the band falls away.
 * children: what stands under the word once it is uncovered (the closing call to action); it rises in as the band
 * falls and cannot be reached or read before that. Reduced motion: shown already cut, the children with it.
 */
export default function Stencil({ children }) {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const rootRef = useRef(null);
  const [stage] = useState(() => (window.matchMedia(COMPACT).matches ? STAGE.compact : STAGE.full));
  // Progress over the pin: from the stage reaching the top of the screen to its release.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', `end ${stage.height}`] });
  const { scrollYProgress: arrive } = useScroll({ target: trackRef, offset: ARRIVE });
  const cut = useTransform(scrollYProgress, CUT_RANGE, [0, 1]);
  const drop = useTransform(scrollYProgress, DROP_RANGE, [0, 1]);
  const closing = useTransform(scrollYProgress, CLOSING_RANGE, [0, 1]);
  // While hidden it also waits off screen: the mobile bar's IntersectionObserver ignores visibility, and would
  // otherwise stand aside for a call to action nobody can see yet.
  const closingY = useTransform(closing, (c) => (c > 0 ? 24 * (1 - c) : CLOSING_AWAY));
  const closingVisibility = useTransform(closing, (c) => (c > 0 ? 'visible' : 'hidden'));

  // The shears lie along the cut, tips at its end. Read from the scroll itself: the values derived from it are
  // brought up to date later in the frame.
  const publish = useCallback(() => {
    const pin = scrollYProgress.get();
    const weight = Math.min(ease(arrive.get()), 1 - span(pin, DROP_RANGE) / LEAVE);
    if (reduce || weight <= 0) {
      setScene(null);
      return;
    }
    const { x, open } = shearsAt(span(pin, CUT_RANGE));
    const rect = rootRef.current.getBoundingClientRect();
    const scale = rect.width / VIEW.width;
    setScene({ weight, tipX: rect.left + x * scale, tipY: rect.top + BAND.top * scale, dirX: 1, dirY: 0, open, scale: stage.shears });
  }, [reduce, scrollYProgress, arrive, stage]);
  useMotionValueEvent(scrollYProgress, 'change', publish);
  useMotionValueEvent(arrive, 'change', publish);

  useEffect(() => {
    publish(); // the page may already be scrolled into the cut
    return () => setScene(null);
  }, [publish]);

  return (
    // Clipped, so the falling band never makes the page longer or wider.
    <div ref={trackRef} className="relative overflow-clip" style={reduce ? undefined : { height: `${(stage.height + stage.pin) * 100}svh` }}>
      <div className={reduce ? 'py-6' : 'sticky top-0 flex items-center'} style={reduce ? undefined : { height: `${stage.height * 100}svh` }}>
        <div className="mx-auto w-full max-w-6xl pl-5 pr-[var(--gutter)]">
          <div ref={rootRef} aria-hidden="true" className="relative">
            <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} className="block h-auto w-full overflow-visible">
              <text {...WORD_PROPS} className="fill-text">
                {WORD}
              </text>
            </svg>
            {!reduce && <StencilBand cut={cut} drop={drop} />}
          </div>
          {children && (
            <motion.div style={reduce ? undefined : { opacity: closing, y: closingY, visibility: closingVisibility }} className="mt-10 md:mt-14">
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
