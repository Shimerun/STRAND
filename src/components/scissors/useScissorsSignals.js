import { useCallback, useEffect, useRef } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { TOP_ID } from '../../lib/scroll.js';
import { clamp, dockRange } from './pose.js';
import { bindRig } from './rig.js';

const DOCK_SPRING = { stiffness: 120, damping: 24 };
const FRAME_SELECTOR = '[data-hero-frame]';

const dockFor = (scrollY, { heroHeight, cutPin }) => {
  const { from, to } = dockRange(heroHeight, cutPin);
  return clamp((scrollY - from) / (to - from), 0, 1);
};

function readGutter() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 0;
}

/**
 * Everything outside the renderer the shears react to: scroll, the docking spring, gutter and hero size,
 * hero visibility, tab visibility and the pointer. Each change calls requestFrame (renderers draw on demand);
 * nothing is requested while the tab is hidden.
 */
export function useScissorsSignals(requestFrame) {
  const signals = useRef({
    gutter: 0,
    heroHeight: window.innerHeight, // the hero's visible frame (pinned while it is cut)
    cutPin: 0, // px of scroll the hero stays pinned for the cut; 0 = no cut
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
    const measure = () => {
      signals.current.gutter = readGutter();
      signals.current.heroHeight = frame?.offsetHeight || window.innerHeight;
      signals.current.cutPin = hero && frame ? Math.max(hero.offsetHeight - frame.offsetHeight, 0) : 0;
      dockTarget.set(dockFor(scrollY.get(), signals.current));
      wake();
    };
    measure();
    window.addEventListener('resize', measure);
    if (!hero) {
      signals.current.heroVisible = false;
      return () => window.removeEventListener('resize', measure);
    }
    // The pin height is set after the hero measures itself, so watch the section too.
    const resizer = new ResizeObserver(measure);
    resizer.observe(hero);
    const observer = new IntersectionObserver(([entry]) => {
      signals.current.heroVisible = entry.isIntersecting;
      wake();
    });
    observer.observe(hero);
    return () => {
      window.removeEventListener('resize', measure);
      resizer.disconnect();
      observer.disconnect();
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
      signals.current.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      signals.current.pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      wake();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [wake]);

  return { signals, scrollY, dock };
}
