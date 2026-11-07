import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { MathUtils } from 'three';
import { TOP_ID } from '../../lib/scroll.js';
import { DOCK_END, END_OFFSET } from './pose.js';
import { bindRig } from './rig.js';

const DOCK_SPRING = { stiffness: 120, damping: 24 };
const END_SELECTOR = '[data-scissors-end]';

const dockFor = (scrollY, heroHeight) => MathUtils.clamp(scrollY / (heroHeight * DOCK_END), 0, 1);

/**
 * Scroll range of the track in scrollY px. It ends END_OFFSET viewports before the
 * [data-scissors-end] element scrolls into view, or at the page bottom when there is none.
 * endTop is that element's viewport top (Infinity without one).
 */
export function readTrack(heroHeight) {
  const viewport = window.innerHeight;
  const start = heroHeight * DOCK_END;
  const endEl = document.querySelector(END_SELECTOR);
  const endTop = endEl ? endEl.getBoundingClientRect().top : Infinity;
  const end = endEl
    ? endTop + window.scrollY - viewport * (1 + END_OFFSET)
    : document.documentElement.scrollHeight - viewport;
  return { start, span: Math.max(end - start, 1), endTop };
}

function readGutter() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 0;
}

/**
 * Everything outside the canvas the rig reacts to: scroll, the docking spring, gutter and hero size,
 * hero visibility, tab visibility and the pointer. Each change requests one frame (frameloop="demand").
 */
export function useScissorsSignals(reduce) {
  const invalidate = useThree((state) => state.invalidate);
  const signals = useRef({
    gutter: 0,
    heroHeight: window.innerHeight,
    heroVisible: true,
    pageHidden: document.hidden,
    pointer: { x: 0, y: 0 },
  });
  const { scrollY } = useScroll();
  const dockTarget = useMotionValue(dockFor(window.scrollY, window.innerHeight));
  const dock = useSpring(dockTarget, DOCK_SPRING);

  const wake = useCallback(() => {
    if (!signals.current.pageHidden) invalidate();
  }, [invalidate]);

  useMotionValueEvent(scrollY, 'change', (value) => {
    dockTarget.set(dockFor(value, signals.current.heroHeight));
    wake();
  });
  useMotionValueEvent(dock, 'change', wake);

  useEffect(() => bindRig(wake), [wake]);

  useEffect(() => {
    const hero = document.getElementById(TOP_ID);
    const measure = () => {
      signals.current.gutter = readGutter();
      signals.current.heroHeight = hero?.offsetHeight || window.innerHeight;
      dockTarget.set(dockFor(scrollY.get(), signals.current.heroHeight));
      wake();
    };
    measure();
    window.addEventListener('resize', measure);
    if (!hero) {
      signals.current.heroVisible = false;
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new IntersectionObserver(([entry]) => {
      signals.current.heroVisible = entry.isIntersecting;
      wake();
    });
    observer.observe(hero);
    return () => {
      window.removeEventListener('resize', measure);
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
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const onMove = (event) => {
      signals.current.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      signals.current.pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      wake();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, wake]);

  return { signals, scrollY, dock, dockTarget };
}
