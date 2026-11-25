// The mirror corridor (Corridor.jsx): the works hang on the two walls of a corridor of facing mirrors, one `gap` px
// apart in depth, and the camera walks down it with the scroll. As a frame reaches the focal plane it swings off its
// wall to face the viewer in the middle, then slides past the camera to its own side.
export const CORRIDOR = {
  // wall: share of the screen width from the middle to a wall; angle: deg a frame on the wall is turned to face
  // across; perspective and gap in px. A phone gets a narrow zig-zag tunnel instead of two walls.
  desktop: { wall: 0.28, angle: 52, perspective: 1000, gap: 1100 },
  mobile: { wall: 0.2, angle: 20, perspective: 800, gap: 700 },
  beat: { desktop: 0.28, mobile: 0.25 }, // screens of scroll per frame
  lead: 1, // frames the camera starts before the first one is in focus...
  tail: 0.2, // ...and goes on past the last
  // How much the camera slows at each frame: 0 steady, 1 standing still (never: a scroll that moves nothing feels
  // stuck). At 0.5 it passes a frame at half its mean pace and runs between them at 150% (at 0.65 the frame swinging
  // in between them crossed the screen at 3.6 px per px of scroll).
  dwell: 0.5,
  // Frames before the focal plane over which a frame swings off its wall to the middle: the whole way from the last
  // frame's stop, so it crosses the screen slowly (at 0.55 it ran 3x the page).
  swing: 1,
  exit: 0.05, // share of the screen width a frame drifts to its side as it dissolves past the camera
  far: 4, // frames ahead that still show (fading in from here)
  fog: 0.8, // most of the page colour over the farthest frame
};

// A frame past the focal plane stays in the middle and dissolves: fading from `fade` frames past focus, gone by
// `gone`, coming on at `push` of the camera's pace, never nearer than `depth` of the perspective. Near the camera a
// small step of the walk is a big one on screen: swung out to its wall it crossed ~600 px in one frame under a fast
// wheel, and at the full pace it still grew and drifted at 3-4 px per px of scroll.
const PASS = { fade: 0.1, gone: 0.4, push: 0.5, depth: 0.35 };
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const smooth = (t) => t * t * (3 - 2 * t);

/** Screens of pinned scroll for n frames. */
export const corridorScreens = (n, beat) => (n - 1 + CORRIDOR.lead + CORRIDOR.tail) * beat;

/** Pin progress (0..1) at which frame i is in focus. */
export const focusProgress = (i, n) => (i + CORRIDOR.lead) / (n - 1 + CORRIDOR.lead + CORRIDOR.tail);

/** Camera position in frames (i = frame i in focus) at pin progress t: slower at each frame, never at rest. */
export function cameraAt(t, n) {
  const x = -CORRIDOR.lead + clamp(t, 0, 1) * (n - 1 + CORRIDOR.lead + CORRIDOR.tail);
  const k = Math.floor(x);
  const u = x - k;
  return k + u - (CORRIDOR.dwell * Math.sin(TAU * u)) / TAU;
}

/**
 * Frame i seen from camera `cam`, for a screen `width` px wide: its CSS transform (centred on the vanishing point),
 * opacity and fog over it (0..1). Pure numbers, so the walk can be checked without a browser. (Paint order needs
 * nothing per frame: a lower index is always nearer.)
 */
export function framePose(i, cam, width, look) {
  const d = i - cam; // > 0 ahead, < 0 passed
  const side = i % 2 ? 1 : -1;
  const off = d > 0 ? 1 - smooth(clamp(1 - d / CORRIDOR.swing, 0, 1)) : 0; // 0 in focus and past it, 1 on its wall
  const z = clamp(-d * look.gap * (d < 0 ? PASS.push : 1), -(CORRIDOR.far + 1) * look.gap, look.perspective * PASS.depth);
  const x = side * width * (look.wall * off + CORRIDOR.exit * smooth(clamp(-d / PASS.gone, 0, 1)));
  const angle = -side * look.angle * off;
  const opacity = clamp((CORRIDOR.far - d) / 0.8, 0, 1) * clamp((d + PASS.gone) / (PASS.gone - PASS.fade), 0, 1);
  return {
    transform: `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${angle.toFixed(2)}deg)`,
    opacity,
    fog: CORRIDOR.fog * clamp((d - 0.3) / (CORRIDOR.far - 0.3), 0, 1),
  };
}
