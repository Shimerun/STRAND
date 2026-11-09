import { motion } from 'framer-motion';

/**
 * "Scroll down" without words: a hairline in the right gutter (the shears' track) with a glint running down it
 * and a small chevron, clear of the mobile bar. opacity: motion value that fades it as the shears take aim
 * (none under reduced motion, where the glint stands still too; see .scroll-cue-glint in index.css).
 */
export default function ScrollCue({ opacity }) {
  return (
    <motion.div
      aria-hidden="true"
      style={opacity ? { opacity } : undefined}
      className="pointer-events-none absolute bottom-[calc(6rem+env(safe-area-inset-bottom))] right-[calc(var(--gutter)/2_-_5.5px)] z-10 flex w-[11px] flex-col items-center gap-1.5 lg:bottom-10"
    >
      <span className="relative block h-12 w-px overflow-hidden bg-concrete/40 lg:h-16">
        <span className="scroll-cue-glint absolute inset-0 bg-gradient-to-b from-transparent via-text to-transparent" />
      </span>
      <svg width="11" height="7" viewBox="0 0 11 7" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-text/80">
        <path d="M1 1l4.5 4.5L10 1" />
      </svg>
    </motion.div>
  );
}
