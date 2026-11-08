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

let scene = null;

/**
 * Lets a DOM scene borrow the shears (e.g. the footer stencil). scene: { weight 0..1, tipX, tipY (viewport px),
 * dirX, dirY (unit vector the tips point along), open 0..1 } or null to give them back.
 */
export function setScene(next) {
  scene = next;
  wake();
}

export function getScene() {
  return scene;
}

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
