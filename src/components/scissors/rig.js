// Renderer-free handle on the shears: DOM components (CutReveal, Stage 4b) read the tip
// and trigger snips through it without pulling three.js into the main bundle.
let wake = () => {};
let burstAt = -Infinity;

export const rig = {
  tipX: 0, // CSS px from the viewport's left edge
  tipY: 0, // CSS px from the viewport's top edge
  visible: false,
  burst() {
    burstAt = performance.now();
    wake();
  },
};

// The mounted rig registers how to request a frame; returns the unbind function.
export function bindRig(onWake) {
  wake = onWake;
  return () => {
    wake = () => {};
  };
}

export function burstElapsed() {
  return (performance.now() - burstAt) / 1000;
}
