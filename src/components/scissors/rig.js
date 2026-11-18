// Renderer-free handle on the shears: DOM components (CutReveal, Stage 4b) read the tip
// and trigger snips through it without pulling three.js into the main bundle.
const idle = () => {};
let wake = idle;
let burstAt = -Infinity;
let scene = null;

export const END_SELECTOR = '[data-scissors-end]'; // the track ends before this element, with the final cut

export const rig = {
  tipX: 0, // CSS px from the viewport's left edge
  tipY: 0, // CSS px from the viewport's top edge
  visible: false,
  burst() {
    burstAt = performance.now();
    wake();
  },
};

/**
 * Lets a DOM scene borrow the shears (e.g. the footer stencil). scene: { weight 0..1, tipX, tipY (viewport px),
 * dirX, dirY (unit vector the tips point along), open 0..1, scale (optional, share of the track length) } or null
 * to give them back.
 */
export function setScene(next) {
  scene = next;
  wake();
}

export const getScene = () => scene;

// The mounted rig registers how to request a frame; returns the unbind function.
export function bindRig(onWake) {
  wake = onWake;
  return () => {
    wake = idle;
  };
}

export const burstElapsed = () => (performance.now() - burstAt) / 1000;
