import { useEffect } from 'react';
import { useScroll, useVelocity } from 'framer-motion';
import { WEIGHT, warmScrollWeights, weightShift } from '../lib/scrollWeight.js';

// Headings that use useScrollWeight are at their thinnest at `full` px/s of scroll; the weight follows the
// speed at `follow` (1/s) and comes back at `release`.
const SPEED = { full: 2000, follow: 10, release: 4 };
const REST = 0.5; // weight units: closer to zero than this counts as at rest
const MAX_STEP_MS = 100; // a long frame (tab switch) never makes the weight jump

/** Drives the shared scroll-speed weight shift. Renders nothing; not mounted under reduced motion. */
export default function ScrollWeight() {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useEffect(() => {
    let frame = 0;
    let last = 0;
    let shift = 0;

    // Runs only while the page scrolls or the weight is still coming back; an idle page costs nothing.
    const tick = (now) => {
      const target = -Math.min(Math.abs(velocity.get()) / SPEED.full, 1) * WEIGHT.range;
      const rate = target < shift ? SPEED.follow : SPEED.release;
      shift += (target - shift) * (1 - Math.exp((-rate * Math.min(now - last, MAX_STEP_MS)) / 1000));
      if (target === 0 && shift > -REST) shift = 0;
      last = now;
      weightShift.set(Math.round(shift / WEIGHT.step) * WEIGHT.step || 0);
      frame = target === 0 && shift === 0 ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const stop = velocity.on('change', wake);
    const stopWarming = warmScrollWeights();
    return () => {
      stop();
      stopWarming();
      cancelAnimationFrame(frame);
      weightShift.set(0);
    };
  }, [velocity]);

  return null;
}
