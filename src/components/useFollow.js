import { useEffect, useRef } from 'react';
import { useMotionValue } from 'framer-motion';

const SMOOTH = 10; // 1/s: how fast the speed settles on what it should be, so it never jumps
const NEAR = 5; // 1/s: closing in, the speed falls off with the distance left, so it eases to a stop
const DONE = 1e-5;

/**
 * A motion value that follows `source` no faster than maxRate(value) per second, easing in and out, so bursts of
 * scrolling turn into steady motion. It requests frames only while it is catching up.
 */
export function useFollow(source, maxRate) {
  const value = useMotionValue(source.get());
  const rate = useRef(maxRate);
  rate.current = maxRate;

  useEffect(() => {
    let frame = 0;
    let last = 0;
    let speed = 0;
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const [current, target] = [value.get(), source.get()];
      const gap = target - current;
      const wanted = Math.sign(gap) * Math.min(rate.current(current), Math.abs(gap) * NEAR);
      speed += (wanted - speed) * (1 - Math.exp(-SMOOTH * dt));
      let next = current + speed * dt;
      if ((next - target) * gap >= 0) {
        next = target; // reached (or passed) the target: stop there
        speed = 0;
      }
      value.set(next);
      frame = Math.abs(target - next) > DONE ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const unsubscribe = source.on('change', wake);
    wake();
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [source, value]);

  return value;
}
