import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion';

// When the blades snap shut on the way down, the photo jolts by `px` and settles back; where the browser allows it
// (Chrome on Android, once the page has been tapped) the phone also gives a short buzz.
const JOLT = { px: 2, s: 0.18 };
const BUZZ_MS = 8;

function buzz() {
  // Without a prior tap Chrome blocks the call and logs a warning, so only try once the page has been touched.
  if (typeof navigator.vibrate !== 'function' || !navigator.userActivation?.hasBeenActive) return;
  navigator.vibrate(BUZZ_MS);
}

/** Motion value (px) for the hero photo's jolt; `snipped` is 1 once the blades have shut (useHeroCut). */
export function useSnipJolt(snipped) {
  const jolt = useMotionValue(0);
  useMotionValueEvent(snipped, 'change', (done) => {
    if (!done) return;
    animate(jolt, [JOLT.px, 0], { duration: JOLT.s, ease: 'easeOut' });
    buzz();
  });
  return jolt;
}
