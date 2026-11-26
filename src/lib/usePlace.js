import { useEffect, useLayoutEffect, useRef } from 'react';
import { rememberPlace, savedPlaceTop, scrollToId, scrollToY } from './scroll.js';
import { REDUCED_MOTION_QUERY } from './useMediaQuery.js';

// Where the reader is on the page, kept across a reload, a return through history, a turned phone and a switch of
// the motion preference (scroll.js rememberPlace / savedPlaceTop).

const PLACE_SAVE_MS = 200; // after the scroll comes to rest

// How this page was opened: 'navigate' (a link, typed or shared), 'reload' or 'back_forward'.
const navigationType = () => performance.getEntriesByType?.('navigation')[0]?.type ?? 'navigate';

// A link to /#section opens at that section; a reload or a return through history opens where the reader was. The
// page is partly laid out by script (the hero pin pulls the next section up), so the browser's own jump on load lands
// in the wrong place: it is switched off, and the jump waits for the fonts and the pins (two frames after them).
// A page brought back from the back/forward cache keeps its own scroll and is left alone.
export function usePlaceOnLoad() {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const id = decodeURIComponent(window.location.hash.slice(1));
    const returning = navigationType() !== 'navigate';
    let frame = 0;
    let cancelled = false;
    const jump = () => {
      const top = returning ? savedPlaceTop() : null;
      if (top !== null) scrollToY(top, { immediate: true });
      else if (id) scrollToId(id, { immediate: true });
    };
    if (returning || id) {
      const settle = returning ? (document.fonts?.ready ?? Promise.resolve()) : Promise.resolve();
      settle.then(() => {
        if (!cancelled) frame = requestAnimationFrame(() => (frame = requestAnimationFrame(jump)));
      });
    }

    let timer = 0;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(rememberPlace, PLACE_SAVE_MS);
    };
    const onHide = () => document.visibilityState === 'hidden' && rememberPlace();
    // A turned phone lays every pin out anew: back to the same share of the section, once that layout is in.
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return; // the address bar coming and going changes the height only
      width = window.innerWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => {
        const top = savedPlaceTop();
        if (top !== null) scrollToY(top, { immediate: true });
      })));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', rememberPlace);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', rememberPlace);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);
}

// A switch of the motion preference takes out or puts back every pin on the page; the reader stays in the same place.
// It is noted by a listener added here, before any component's own (theirs come with their effects): React renders
// after each listener of a 'change' event, so this is the last moment the old layout is still on screen.
const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
reducedMotion.addEventListener('change', rememberPlace);

// ...and restored once the new layout is in, before it is painted: App's own listener (usePrefersReducedMotion) is the
// last to run.
export function useKeepPlaceAcross(value) {
  const seen = useRef(value);
  useLayoutEffect(() => {
    if (seen.current === value) return;
    seen.current = value;
    const top = savedPlaceTop();
    if (top !== null) scrollToY(top, { immediate: true });
  }, [value]);
}
