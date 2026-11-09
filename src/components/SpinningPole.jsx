import { useRef } from 'react';
import { useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useVelocity } from 'framer-motion';
import BarberPole, { STRIPE } from './BarberPole.jsx';

const HEIGHT = 56; // px
const SPIN = 0.8; // stripe periods per second at rest (one turn of the cylinder ≈ 2.5 s)
const BOOST = 0.003; // extra speed factor per px/s of scroll
const MAX_FACTOR = 5;

/**
 * The pole beside the wordmark (header and mobile menu). It turns all the time, like a real one, and spins
 * faster while the page scrolls. The loop pauses with the tab (requestAnimationFrame). Reduced motion: still.
 */
export default function SpinningPole() {
  const reduce = useReducedMotion();
  const phase = useRef(0);
  const stripesY = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const factor = Math.min(1 + Math.abs(velocity.get()) * BOOST, MAX_FACTOR);
    phase.current = (phase.current + (SPIN * factor * delta) / 1000) % 1;
    stripesY.set(-phase.current * STRIPE.period);
  });

  return <BarberPole height={HEIGHT} stripesY={stripesY} />;
}
