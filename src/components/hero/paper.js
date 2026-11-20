// A strip of paper falling once it is cut free (the footer stencil's band, StencilBand.jsx).

import { TAU } from '../../lib/heroCut.js';

// The strip falls like a sheet of paper: it drops `y` frame heights, slowed by the air (`drag` < 2 is less of an
// ease-in than a free fall), swinging `swings` times side to side by `sway` of the frame width; it tips `tilt` deg
// into each swing, turns `yaw` deg about its vertical axis and pitches back by `pitch` deg; `spin` deg overall.
// `settle`: share of the fall over which the swinging builds up.
const FALL = { y: 1.05, drag: 1.6, swings: 1.25, sway: 0.05, tilt: 7, yaw: 14, pitch: 22, spin: 6, settle: 0.25, perspective: 1600 };

/** The falling strip's transform at progress `split` (0..1) for a frame of width × height px. */
export function fallAt(split, width, height) {
  const swing = TAU * FALL.swings * split;
  const build = Math.min(split / FALL.settle, 1);
  return {
    x: width * FALL.sway * Math.sin(swing) * build,
    y: height * FALL.y * split ** FALL.drag,
    // Tipped the way it moves: the leading side lower.
    rotate: FALL.spin * split + FALL.tilt * Math.cos(swing) * build,
    rotateX: -FALL.pitch * split,
    rotateY: FALL.yaw * Math.sin(swing + 1) * build,
    perspective: FALL.perspective,
  };
}
