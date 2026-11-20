import { useLayoutEffect } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { clamp01, ease, heroCutPhases } from '../../lib/heroCut.js';

const SLIDE_PAST = 1.04; // the photo travels this share of its width to the left: its edge shadow leaves too
const UNDERLAY_FROM = 0.3; // the next section starts this share of the width to the right and slides in under it
const PARALLAX = 20; // % of the photo height over the whole hero scroll

/**
 * Motion values for the hero's exit (src/lib/heroCut.js): one snip on the photo's right edge, then the photo
 * slides off to the left and the underlay, the section after the hero that CSS holds under the frame for the
 * whole pin (see Hero.jsx), slides in from the right into its own place.
 * underlayRef: the sticky element holding that section (absent under reduced motion).
 */
export function useHeroCut(sectionRef, frameRef, underlayRef, enabled) {
  const { scrollY } = useScroll();
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const pin = useMotionValue(0);

  // A layout effect: the underlay is pulled up before the first paint. Done after it, the whole next section
  // jumped into the screen (hidden under the hero, but a layout shift of 1.0 to Core Web Vitals).
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const underlay = underlayRef.current;
    const wrapper = underlay?.parentElement;
    const measure = () => {
      const pinPx = Math.max(section.offsetHeight - frame.offsetHeight, 0);
      width.set(frame.offsetWidth);
      height.set(frame.offsetHeight);
      pin.set(pinPx);
      if (!enabled || !underlay) return;
      // Up to the top of the hero, beneath it; where the content comes to rest once the pin is over.
      wrapper.style.marginTop = `-${section.offsetHeight}px`;
      underlay.dataset.restTop = String(section.offsetTop + pinPx);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(frame);
    // Tab into the section while the photo still covers it: skip to where it rests, so the focused control shows.
    const uncover = () => {
      const rest = Number(underlay?.dataset.restTop);
      if (rest && window.scrollY < rest - 1) window.scrollTo({ top: rest, behavior: 'auto' });
    };
    underlay?.addEventListener('focusin', uncover);
    return () => {
      underlay?.removeEventListener('focusin', uncover);
      observer.disconnect();
      if (!underlay) return;
      wrapper.style.marginTop = '';
      delete underlay.dataset.restTop;
      Object.assign(underlay.style, { transform: '', willChange: '' });
    };
  }, [sectionRef, frameRef, underlayRef, enabled, width, height, pin]);

  const phases = useTransform([scrollY, pin], ([y, p]) => heroCutPhases(y, p));
  const slide = useTransform(phases, (phase) => ease(phase.slide));

  // Only the shift is scripted (its place is held by CSS), and as a string, so the style is written when it
  // changes, not on every scroll frame; it is a layer of its own only while it moves.
  const underlayShift = useTransform([scrollY, pin, slide, width], ([y, p, s, w]) =>
    p > 0 && y < p ? `translate3d(${Math.round((1 - s) * UNDERLAY_FROM * w)}px, 0, 0)` : '',
  );
  useMotionValueEvent(underlayShift, 'change', (transform) => {
    const underlay = underlayRef.current;
    if (!underlay) return;
    underlay.style.transform = transform;
    underlay.style.willChange = transform ? 'transform' : '';
  });

  return {
    aim: useTransform(phases, (phase) => phase.aim),
    // 1 once the blades have shut: the photo jolts (useSnipJolt).
    snipped: useTransform(phases, (phase) => (phase.snip >= 1 ? 1 : 0)),
    // The fresh cut along the photo's right edge comes up as the blades shut.
    edge: useTransform(phases, (phase) => phase.snip),
    slideX: useTransform([slide, width], ([s, w]) => -s * SLIDE_PAST * w),
    // Gone once the photo has left, so the invisible frame never covers the section beneath.
    frameVisibility: useTransform(phases, (phase) => (phase.slide >= 1 ? 'hidden' : 'visible')),
    parallaxY: useTransform([scrollY, height, pin], ([y, h, p]) => `${clamp01(y / (h + p || 1)) * PARALLAX}%`),
  };
}
