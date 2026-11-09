import { motion, useScroll } from 'framer-motion';

/**
 * How far down the page you are, as a line along the header's lower edge. Below xl only: from xl the comb
 * scale (ScrollScale) shows it. It follows the scroll directly, so it stays under reduced motion too.
 * will-change gives it a layer of its own: without one, every step of the line repaints the whole header.
 */
export default function ScrollProgress({ visible }) {
  const { scrollYProgress } = useScroll();

  return (
    <motion.span
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-accent transition-opacity duration-300 will-change-transform xl:hidden ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
