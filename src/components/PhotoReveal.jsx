import { useEffect, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { fadeReveal, revealViewport } from '../lib/motion.js';
import { DRIFT, OPEN_FROM, RADIUS, ZOOM } from '../lib/photoMotion.js';
import Img from './Img.jsx';

const fadeProps = { variants: fadeReveal, initial: 'hidden', whileInView: 'visible', viewport: revealViewport };

/**
 * Photo that opens with the scroll (clip-path from `from`) while the image inside settles from a zoom,
 * then drifts slower than the page. openBy: 'center' opens it fully when its centre reaches the centre of the
 * screen, 'inView' as soon as the whole frame is on screen. Reduced motion: plain fade-in, no clip, zoom or drift.
 */
export default function PhotoReveal({ from = 'sides', openBy = 'center', className = '', ...imgProps }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  // Share of the pass the opening takes: 'center' (start end → center center) is exactly half; 'inView' (start
  // end → end end) depends on the frame and screen heights, so it is measured on resize, not every scroll frame.
  const openShare = useRef(0.5);
  // One scroll target per photo (framer measures every target on every scroll frame).
  const { scrollYProgress: pass } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const open = useTransform(pass, (progress) => Math.min(progress / openShare.current, 1));

  useEffect(() => {
    if (openBy !== 'inView' || reduce) return undefined;
    const element = ref.current;
    const measure = () => {
      const height = element.offsetHeight;
      if (height > 0) openShare.current = height / (window.innerHeight + height);
    };
    const resized = new ResizeObserver(measure);
    resized.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      resized.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [openBy, reduce]);
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
