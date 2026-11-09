import { useEffect } from 'react';
import { motionValue } from 'framer-motion';

// Headings lose up to `range` units of weight to the scroll speed, in steps of `step`. Steps, not a smooth
// change: the first use of each weight makes the browser build an instance of the variable font (a dropped
// frame on a phone), so the set is kept small and built ahead of time by warmScrollWeights().
export const WEIGHT = { range: 300, step: 25 };

// The shift right now: 0 at rest, down to -range while scrolling fast, always a multiple of the step.
// Driven by ScrollWeight.jsx; stays 0 under reduced motion, where that component is not mounted.
export const weightShift = motionValue(0);

const targets = new Set();
const settings = (weight) => `"wght" ${weight}`;

/**
 * Thins the text in `ref` (font weight `base` at rest) with the scroll speed, while it is on screen. Only that
 * element's own style changes: a variable on :root would make the browser restyle the whole page every frame.
 */
export function useScrollWeight(ref, base) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const target = { element, base };
    let onScreen = false;
    const apply = (shift) => {
      element.style.fontVariationSettings = settings(base + (onScreen ? shift : 0));
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      apply(weightShift.get());
    });
    observer.observe(element);
    const stop = weightShift.on('change', (shift) => onScreen && apply(shift));
    targets.add(target);
    return () => {
      targets.delete(target);
      observer.disconnect();
      stop();
      element.style.fontVariationSettings = '';
    };
  }, [ref, base]);
}

/**
 * Builds the font instance of every step ahead of use, one per idle slice, on a hidden copy of the first
 * heading that uses the effect (same family and size, so the instances are the ones the headings will get).
 * Returns a function that cancels what is left.
 */
export function warmScrollWeights() {
  const idle = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 50));
  const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
  let probe = null;
  let step = 1;

  let id = idle(function warm() {
    const target = targets.values().next().value;
    if (!target) return;
    if (!probe) {
      const { fontFamily, fontSize, fontWeight, fontStyle, fontStretch } = getComputedStyle(target.element);
      probe = document.createElement('span');
      probe.setAttribute('aria-hidden', 'true');
      probe.textContent = target.element.textContent;
      Object.assign(probe.style, { position: 'fixed', left: '0', top: '0', visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily, fontSize, fontWeight, fontStyle, fontStretch });
      document.body.append(probe);
    }
    probe.style.fontVariationSettings = settings(target.base - step * WEIGHT.step);
    void probe.offsetWidth; // lays the text out, which is what builds the instance
    step += 1;
    if (step * WEIGHT.step <= WEIGHT.range) id = idle(warm);
    else probe.remove();
  });

  return () => {
    cancelIdle(id);
    probe?.remove();
  };
}
