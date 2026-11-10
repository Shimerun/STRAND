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
  // A section that is held on screen part of the time (the one pinned under the hero) is not where it looks:
  // its holder names the page position it comes to rest at, and that is the place to scroll to.
  const rest = el.parentElement?.dataset.restTop;
  if (lenis) {
    wakeLenis?.();
    if (rest) lenis.scrollTo(Number(rest));
    else lenis.scrollTo(el, { offset: HEADER_OFFSET });
    return;
  }
  const top = rest ? Number(rest) : el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
