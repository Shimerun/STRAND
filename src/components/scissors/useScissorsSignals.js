import { useCallback, useEffect, useRef } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { clamp01 } from '../../lib/heroCut.js';
import { TOP_ID } from '../../lib/scroll.js';
import { dockRange } from './pose.js';
import { END_SELECTOR, bindRig } from './rig.js';

const DOCK_SPRING = { stiffness: 120, damping: 24 };
const FRAME_SELECTOR = '[data-hero-frame]';

// Layout offset of an element inside the frame, walking offset parents: transforms on the pieces of the cut never
// skew it.
function offsetTopIn(el, frame) {
  let top = 0;
  for (let node = el; node && node !== frame; node = node.offsetParent) top += node.offsetTop;
  return top;
}

/**
 * The free band between the hero's headline and its address, in frame px ({ top, bottom }), where a phone too short
 * for the usual resting pose lays the shears (pose.js fitHeroPose); null without a hero. The first match is the
 * uncut piece (the strip's copy follows it).
 */
export function measureHeroBand(frame = document.querySelector(FRAME_SELECTOR)) {
  const top = frame?.querySelector('[data-hero-band="top"]');
  const bottom = frame?.querySelector('[data-hero-band="bottom"]');
  if (!top || !bottom) return null;
  return { top: offsetTopIn(top, frame) + top.offsetHeight, bottom: offsetTopIn(bottom, frame) };
}

const dockFor = (scrollY, { heroHeight, cutPin }) => {
  const { from, to } = dockRange(heroHeight, cutPin);
  return clamp01((scrollY - from) / (to - from));
};

/**
 * Everything outside the renderer the shears react to: scroll, the docking spring, gutter, page and hero
 * size, where the track ends, hero visibility, tab visibility and the pointer. Sizes and positions are
 * measured here, when the layout changes, so the per-frame motion (rigMotion.js) never reads the DOM. Each
 * change calls requestFrame (renderers draw on demand); nothing is requested while the tab is hidden.
 */
export function useScissorsSignals(requestFrame) {
  const signals = useRef({
    gutter: 0,
    pageWidth: document.documentElement.clientWidth,
    pageHeight: document.documentElement.scrollHeight,
    // The window, measured on resize: reading innerWidth / innerHeight in per-frame code made the browser
    // recompute the layout first, every frame.
    viewWidth: window.innerWidth,
    viewHeight: window.innerHeight,
    endTop: null, // page-space top of the [data-scissors-end] element, px; null without one
    heroHeight: window.innerHeight, // the hero's visible frame (pinned while it is cut)
    cutPin: 0, // px of scroll the hero stays pinned for the cut; 0 = no cut
    heroBand: null, // free band under the headline, see measureHeroBand
    heroVisible: true,
    pageHidden: document.hidden,
    pointer: { x: 0, y: 0 },
  });
  const { scrollY } = useScroll();
  const dockTarget = useMotionValue(dockFor(window.scrollY, signals.current));
  const dock = useSpring(dockTarget, DOCK_SPRING);

  const wake = useCallback(() => {
    if (!signals.current.pageHidden) requestFrame();
  }, [requestFrame]);

  useMotionValueEvent(scrollY, 'change', (value) => {
    dockTarget.set(dockFor(value, signals.current));
    wake();
  });
  useMotionValueEvent(dock, 'change', wake);

  useEffect(() => bindRig(wake), [wake]);

  useEffect(() => {
    const hero = document.getElementById(TOP_ID);
    const frame = hero?.querySelector(FRAME_SELECTOR) ?? hero;
    const end = document.querySelector(END_SELECTOR);
    const measure = () => {
      signals.current.gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 0;
      signals.current.pageWidth = document.documentElement.clientWidth;
      signals.current.pageHeight = document.documentElement.scrollHeight;
      signals.current.viewWidth = window.innerWidth;
      signals.current.viewHeight = window.innerHeight;
      signals.current.endTop = end ? end.getBoundingClientRect().top + window.scrollY : null;
      signals.current.heroHeight = frame?.offsetHeight || window.innerHeight;
      signals.current.cutPin = hero && frame ? Math.max(hero.offsetHeight - frame.offsetHeight, 0) : 0;
      signals.current.heroBand = frame ? measureHeroBand(frame) : null;
      dockTarget.set(dockFor(scrollY.get(), signals.current));
      wake();
    };
    measure();
    window.addEventListener('resize', measure);
    // Anything that moves the end element (late content, fonts, an opened form) changes the page height.
    const resizer = new ResizeObserver(measure);
    resizer.observe(document.body);
    let observer;
    if (hero) {
      // The pin height is set after the hero measures itself, so watch the section too.
      resizer.observe(hero);
      observer = new IntersectionObserver(([entry]) => {
        signals.current.heroVisible = entry.isIntersecting;
        wake();
      });
      observer.observe(hero);
    } else signals.current.heroVisible = false;
    return () => {
      window.removeEventListener('resize', measure);
      resizer.disconnect();
      observer?.disconnect();
    };
  }, [dockTarget, scrollY, wake]);

  useEffect(() => {
    const onVisibility = () => {
      signals.current.pageHidden = document.hidden;
      wake();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [wake]);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    const onMove = (event) => {
      signals.current.pointer.x = (event.clientX / signals.current.viewWidth) * 2 - 1;
      signals.current.pointer.y = (event.clientY / signals.current.viewHeight) * 2 - 1;
      wake();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [wake]);

  return { signals, scrollY, dock };
}
