export const EASE_REVEAL = [0.4, 0, 0.2, 1];
export const EASE_HOVER = [0.26, 1.04, 0.54, 1];

export const revealViewport = { once: true, amount: 0.3 };

export const textReveal = {
  hidden: { opacity: 0, y: 24, filter: 'blur(12px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE_REVEAL } },
};

// prefers-reduced-motion: plain fade, no blur or movement.
export const fadeReveal = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE_REVEAL } },
};

export const hoverLift = { y: -2, transition: { duration: 0.3, ease: EASE_HOVER } };
