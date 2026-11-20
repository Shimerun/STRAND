// Matches the fixed header height (tailwind spacing.header).
export const HEADER_HEIGHT = 72;
const HEADER_OFFSET = -HEADER_HEIGHT;

export const TOP_ID = 'top';
export const MAIN_ID = 'main';
export const BOOKING_ID = 'booking';

let lenis = null;
let wakeLenis = null;

// wake: starts the frame loop that drives Lenis; it only runs while Lenis animates (see useLenis in App.jsx).
export function setLenis(instance, wake = null) {
  lenis = instance;
  wakeLenis = wake;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const MOUSE_QUERY = '(hover: hover) and (pointer: fine)';
export const hasMouse = () => window.matchMedia(MOUSE_QUERY).matches;

// Lenis is absent under reduced motion and on touch screens, so fall back to locking the root element.
export function lockScroll() {
  if (lenis) lenis.stop();
  else document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll() {
  if (lenis) lenis.start();
  else document.documentElement.style.overflow = '';
}

// Keyboard focus and the address bar follow the scroll: the next Tab starts inside the section, and the link
// can be shared. tabindex -1 makes a section focusable by script only (index.css hides its ring).
function arriveAt(el, id) {
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  history.replaceState(null, '', `#${id}`);
}

// immediate: jump without the smooth scroll (opening a link with #id).
export function scrollToId(id, { immediate = false } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  arriveAt(el, id);
  // A section that is held on screen part of the time (the one pinned under the hero) is not where it looks:
  // its holder names the page position it comes to rest at, and that is the place to scroll to.
  const rest = el.parentElement?.dataset.restTop;
  const top = rest ? Number(rest) : el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET;
  // A jump goes past Lenis: right after load it still clamps to the page height it measured before the content
  // was in, and stopped 160px short of the booking form. Lenis follows the native scroll.
  if (lenis && !immediate) {
    wakeLenis?.();
    lenis.scrollTo(top);
    return;
  }
  window.scrollTo({ top, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
}
