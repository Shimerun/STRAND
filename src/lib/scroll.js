// Matches the fixed header height (tailwind spacing.header).
const HEADER_OFFSET = -72;

export const TOP_ID = 'top';
export const BOOKING_ID = 'booking';

let lenis = null;
let wakeLenis = null;

// wake: starts the frame loop that drives Lenis; it only runs while Lenis animates (see useLenis in App.jsx).
export function setLenis(instance, wake = null) {
  lenis = instance;
  wakeLenis = wake;
}

export function getLenis() {
  return lenis;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Lenis is absent under reduced motion, so fall back to locking the root element.
export function lockScroll() {
  if (lenis) lenis.stop();
  else document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll() {
  if (lenis) lenis.start();
  else document.documentElement.style.overflow = '';
}

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    wakeLenis?.();
    lenis.scrollTo(el, { offset: HEADER_OFFSET });
    return;
  }
  const top = el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
