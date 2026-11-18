import { motion, useScroll } from 'framer-motion';

// Page progress along the header's lower edge; it follows the scroll directly, so it stays under reduced motion.
// will-change gives it its own layer: without one, every step repaints the whole header.
export default function ScrollProgress({ visible }) {
  const { scrollYProgress } = useScroll();

  return (
    <motion.span
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-accent transition-opacity duration-300 will-change-transform ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
