// Matches the fixed header height (tailwind spacing.header).
const HEADER_OFFSET = -72;

let lenis = null;

export function setLenis(instance) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: HEADER_OFFSET });
    return;
  }
  const top = el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
