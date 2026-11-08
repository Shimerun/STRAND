export const EASE_REVEAL = [0.4, 0, 0.2, 1];
export const EASE_HOVER = [0.26, 1.04, 0.54, 1];
export const EASE_MASK = [0.16, 1, 0.3, 1]; // fast start, long settle: words rising out of a mask

export const revealViewport = { once: true, amount: 0.3 };

// List items in the same row reveal one after another; `index` comes through Reveal's `custom`.
const STAGGER = { step: 0.08, columns: 3 };

export const textReveal = {
  hidden: { opacity: 0, y: 24, filter: 'blur(12px)' },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: EASE_REVEAL, delay: (index % STAGGER.columns) * STAGGER.step },
  }),
};

// Section titles: each word rises out of its own mask, one after another.
export const maskWords = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
export const maskWord = {
  hidden: { y: '110%' },
  visible: { y: 0, transition: { duration: 0.8, ease: EASE_MASK } },
};

// prefers-reduced-motion: plain fade, no blur or movement.
export const fadeReveal = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE_REVEAL } },
};

export const hoverLift = { y: -2, transition: { duration: 0.3, ease: EASE_HOVER } };
export const tapPress = { scale: 0.97, transition: { duration: 0.15, ease: EASE_HOVER } };
