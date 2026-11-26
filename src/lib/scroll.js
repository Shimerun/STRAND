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
  scrollToY(rest ? Number(rest) : el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET, { immediate });
}

// The reader's place, kept for a reload or a return through history: the section at the top of the screen and how
// far into it, since the page above can come out a little taller or shorter next time (fonts, reviews, pins).
const PLACE_KEY = 'strand:place';
const PLACE_ANCHORS = 'main > section[id], main [data-hero-underlay] section[id], footer';

// Page top of a section: where a pinned one comes to rest (see scrollToId), else its box.
function restTopOf(el) {
  const rest = el.parentElement?.dataset.restTop;
  return rest ? Number(rest) : el.getBoundingClientRect().top + window.scrollY;
}

function anchors() {
  return [...document.querySelectorAll(PLACE_ANCHORS)].map((el) => ({ el, top: restTopOf(el) })).sort((a, b) => a.top - b.top);
}

/** Saves where the reader is (sessionStorage; nothing when storage is blocked). */
export function rememberPlace() {
  const y = window.scrollY;
  const line = y + HEADER_HEIGHT;
  const current = anchors().filter(({ top }) => top <= line).at(-1);
  const offset = current ? y - current.top : y;
  const place = {
    id: current ? current.el.id || 'footer' : '',
    offset: Math.round(offset),
    // The share of the section read, for a screen of another width (the phone turned), where heights change.
    share: current ? Math.min(offset / Math.max(current.el.offsetHeight, 1), 1) : null,
    width: window.innerWidth,
    path: window.location.pathname,
  };
  try {
    sessionStorage.setItem(PLACE_KEY, JSON.stringify(place));
  } catch {
    /* storage blocked: a reload starts at the top */
  }
}

/** The saved place as a page position, or null. Clamped into its section, which may have come out shorter. */
export function savedPlaceTop() {
  let place;
  try {
    place = JSON.parse(sessionStorage.getItem(PLACE_KEY) ?? 'null');
  } catch {
    return null;
  }
  if (!place || place.path !== window.location.pathname) return null;
  if (!place.id) return place.offset;
  const el = place.id === 'footer' ? document.querySelector('footer') : document.getElementById(place.id);
  if (!el) return null;
  const top = restTopOf(el);
  const height = el.offsetHeight;
  if (place.width !== window.innerWidth && place.share !== null) return top + place.share * height;
  return top + Math.min(place.offset, Math.max(height - HEADER_HEIGHT, 0));
}

/** Scrolls the page to `top` (px): smoothly through Lenis where it runs, natively otherwise. */
export function scrollToY(top, { immediate = false } = {}) {
  // A jump goes past Lenis: right after load it still clamps to the page height it measured before the content
  // was in, and stopped 160px short of the booking form. Lenis follows the native scroll.
  if (lenis && !immediate) {
    wakeLenis?.();
    lenis.scrollTo(top);
    return;
  }
  window.scrollTo({ top, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
}
