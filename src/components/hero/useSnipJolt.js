import { useRef } from 'react';
import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion';

// Each time the blades snap shut on the way down, the cut sheet jolts by `px` and settles back; where the browser
// allows it (Chrome on Android, once the page has been tapped) the phone also gives a short buzz.
const JOLT = { px: 2, s: 0.18 };
const BUZZ_MS = 8;

function buzz() {
  // Without a prior tap Chrome blocks the call and logs a warning, so only try once the page has been touched.
  if (typeof navigator.vibrate !== 'function' || !navigator.userActivation?.hasBeenActive) return;
  navigator.vibrate(BUZZ_MS);
}

/** Motion value (px) for the hero frame's jolt; `state` is the cut state from useHeroCut. */
export function useSnipJolt(state) {
  const jolt = useMotionValue(0);
  const closings = useRef(state.get()?.closings ?? 0);

  useMotionValueEvent(state, 'change', (s) => {
    const done = s?.closings ?? 0;
    if (done > closings.current) {
      animate(jolt, [JOLT.px, 0], { duration: JOLT.s, ease: 'easeOut' });
      buzz();
    }
    closings.current = done;
  });

  return jolt;
}
