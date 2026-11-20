// Scroll-driven exit of the hero, shared by the hero (DOM) and the shears (rig) so the snip and the slide agree.
// The hero pins for `pin` frame heights of scroll: the shears move onto the photo's right edge and snip it once,
// then the photo slides off to the left while the services slide in from the right.
export const HERO_CUT = {
  // Short, so one scroll gesture starts it and the page carries on. Until 2026-11-20 it was a cut of 3 to 7 snips
  // along a wavy line over 1 / 1.5 screens (in git before that date).
  pin: { mobile: 0.8, desktop: 1 },
  aimEnd: 0.25, // share of the pin: the shears move from the hero pose onto the edge, opening as they go
  snipEnd: 0.45, // share of the pin: the blades shut once; the photo slides away over the rest
  openShare: 0.8, // how wide the blades open, share of the model's max opening
  bite: 3, // power of the closing ease: the blades press slowly, then snap shut
};

// Shared with the shears, the hero and the footer stencil.
export const TAU = Math.PI * 2;
export const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
export const ease = (t) => t * t * (3 - 2 * t); // smoothstep on 0..1

// Progress through [from, to] at t; exactly 1 from `to` on (floating point left 0.9999… at the very end of the pin,
// where a link to the next section lands).
const span = (t, from, to) => (t >= to ? 1 : clamp01((t - from) / (to - from)));

/** Progress 0..1 of each phase at `scrollY` for a pin of `pin` px (0 = no pin, everything stays 0). */
export function heroCutPhases(scrollY, pin) {
  if (pin <= 0) return { aim: 0, snip: 0, slide: 0 };
  const t = scrollY / pin;
  const { aimEnd, snipEnd } = HERO_CUT;
  return { aim: span(t, 0, aimEnd), snip: span(t, aimEnd, snipEnd), slide: span(t, snipEnd, 1) };
}

/** How far the blades are open, 0..1: they open on the way to the edge and shut over the snip. */
export const bladeOpen = ({ aim, snip }) => (snip > 0 ? 1 - snip ** HERO_CUT.bite : ease(aim));
