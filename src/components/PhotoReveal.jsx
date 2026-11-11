import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { fadeReveal, revealViewport } from '../lib/motion.js';
import Img from './Img.jsx';

// Where the photo opens from: inset (%) on each side [top, right, bottom, left] before it reaches full size.
const OPEN_FROM = {
  sides: [0, 30, 0, 30],
  left: [0, 55, 0, 0],
  right: [0, 0, 0, 55],
  bottom: [45, 0, 0, 0],
};
const RADIUS = 6; // px, theme borderRadius: the opening edge keeps the card's corners
// The photo starts zoomed in, settles to `rest` as it opens and keeps that margin for the drift.
const ZOOM = { from: 1.25, rest: 1.1 };
const DRIFT = 4; // % of the photo height it moves inside its frame over the whole pass (needs ZOOM.rest > 1 + 2 * DRIFT / 100)

const fadeProps = { variants: fadeReveal, initial: 'hidden', whileInView: 'visible', viewport: revealViewport };

/**
 * Photo that opens with the scroll (clip-path from `from`) while the image inside settles from a zoom,
 * then drifts slower than the page. Reduced motion: plain fade-in, no clip, zoom or drift.
 */
export default function PhotoReveal({ from = 'sides', className = '', ...imgProps }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  // One scroll target per photo (framer measures every target on every scroll frame). From 'start end' to
  // 'center center' is exactly half of the whole pass, so the opening is the first half of it.
  const { scrollYProgress: pass } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const open = useTransform(pass, (progress) => Math.min(progress * 2, 1));
  const insets = OPEN_FROM[from] ?? OPEN_FROM.sides;

  const clipPath = useTransform(open, (progress) => {
    const closed = 1 - Math.min(Math.max(progress, 0), 1);
    const [top, right, bottom, left] = insets.map((inset) => inset * closed);
    return `inset(${top}% ${right}% ${bottom}% ${left}% round ${RADIUS}px)`;
  });
  const scale = useTransform(open, [0, 1], [ZOOM.from, ZOOM.rest]);
  const y = useTransform(pass, [0, 1], [`-${DRIFT}%`, `${DRIFT}%`]);

  return (
    <motion.div
      ref={ref}
      // Layers for the clip and for the zoomed photo: as the clip opens and the photo drifts on each scroll
      // frame, only the clip's mask is redrawn, not the photo and everything painted with it.
      className={`overflow-hidden ${reduce ? '' : 'will-change-transform'} ${className}`}
      style={reduce ? undefined : { clipPath }}
      {...(reduce ? fadeProps : undefined)}
    >
      <motion.div className={`h-full w-full ${reduce ? '' : 'will-change-transform'}`} style={reduce ? undefined : { scale, y }}>
        <Img {...imgProps} className="h-full w-full object-cover" />
      </motion.div>
    </motion.div>
  );
}
