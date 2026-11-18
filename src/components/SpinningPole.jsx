import { useRef } from 'react';
import { useMotionValueEvent, useScroll, useVelocity } from 'framer-motion';
import BarberPole from './BarberPole.jsx';

const HEIGHT = 56; // px
const PERIOD_S = 1.25; // one stripe passing at rest (one turn of the cylinder ≈ 2.5 s)
const BOOST = 0.003; // extra speed factor per px/s of scroll
const MAX_FACTOR = 5;
const RATE_STEP = 0.25; // the speed changes in steps, so the running loop is retimed a few times, not every frame

// The pole beside the wordmark: always turning, faster while the page scrolls. Only the CSS loop's playback
// rate changes, so it stays on the compositor. Reduced motion: still (the loop is off in CSS).
export default function SpinningPole() {
  const stripes = useRef(null);
  const rate = useRef(1);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useMotionValueEvent(velocity, 'change', (speed) => {
    const next = Math.round(Math.min(1 + Math.abs(speed) * BOOST, MAX_FACTOR) / RATE_STEP) * RATE_STEP;
    if (next === rate.current) return;
    rate.current = next;
    stripes.current?.getAnimations?.().forEach((animation) => animation.updatePlaybackRate(next));
  });

  return <BarberPole height={HEIGHT} period={PERIOD_S} stripesRef={stripes} />;
}
