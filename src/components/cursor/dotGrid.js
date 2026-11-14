// The dot trail under the cursor (DotTrail.jsx): a grid of dots on the section bands that shows up around the
// pointer, shies away from it and eases back home, fading out behind it. Page px; steps at 60 Hz.

// Everything that sets how the dots look and move; tune here.
export const DOTS = {
  gap: 22, // px between dots
  size: 1.3, // dot radius, px
  color: '#8A8A8A', // tailwind concrete
  tint: '#6B7F5E', // tailwind accent: dots the pointer has moved, and all of them with the button held
  tinted: 0.7, // how far towards `tint` a fully tinted dot goes (0 never, 1 all the way)
  tintAt: 24, // px a dot has been moved for it to be fully tinted
  tintSpeed: 0.15, // share of the way to its tint per step
  opacity: 0.8, // of a fully shown dot in the middle of a band's light spot
  shade: 0.4, // brightness away from the light spot (index.css .band --light), as a share of that
  show: 150, // px: dots within this distance of the pointer show up, fully near it and fading towards the edge
  appear: 0.35, // share of the way to fully shown per step: how fast they come up
  fade: 0.88, // share of the brightness kept per step once the pointer has gone: 0.88 → gone in about 0.4 s
  radius: 90, // px: the pointer pushes dots within this distance
  strength: 6, // push at the pointer, falling off to 0 at `radius`
  pressed: 1.6, // push multiplier with the mouse button held
  returnSpeed: 0.08, // spring back home, share of the offset per step
  friction: 0.6, // speed kept per step; at 0.6 or less (with returnSpeed 0.08) a dot eases home without overshooting
  still: 0.01, // px or brightness per step: below this for every dot nothing moves and the loop stops
};

const rgb = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const [PLAIN, TINT] = [rgb(DOTS.color), rgb(DOTS.tint)];
/** Fill colours from plain (first) to fully tinted (last); a dot's `tint` (0–1) picks one. */
export const SHADES = Array.from({ length: 17 }, (_, i) => {
  const share = (i / 16) * DOTS.tinted;
  return `rgb(${PLAIN.map((c, k) => Math.round(c + (TINT[k] - c) * share)).join(' ')})`;
});

/** reduced: prefers-reduced-motion (dots show, fade and tint but are not pushed). */
export function createDots(reduced) {
  const dots = new Map(); // `${col},${row}` → dot; only the ones showing or still moving
  let stepId = 0;

  // Marks the grid dots near the pointer with how bright they should be, creating them as they come into reach.
  function reveal({ x, y }) {
    const { gap, show } = DOTS;
    for (let row = Math.ceil((y - show) / gap); row <= Math.floor((y + show) / gap); row++) {
      for (let col = Math.ceil((x - show) / gap); col <= Math.floor((x + show) / gap); col++) {
        const [homeX, homeY] = [col * gap, row * gap];
        const d = Math.hypot(homeX - x, homeY - y);
        if (d >= show) continue;
        const key = `${col},${row}`;
        if (!dots.has(key)) dots.set(key, { homeX, homeY, ox: 0, oy: 0, vx: 0, vy: 0, shown: 0, target: 0, tint: 0, seen: 0 });
        const dot = dots.get(key);
        dot.target = 1 - (d / show) ** 2;
        dot.seen = stepId;
      }
    }
  }

  return {
    dots,
    /** One step with the pointer at page px ({ x, y } or null). True while anything still moves. */
    step(pointer, pressed) {
      stepId++;
      if (pointer) reveal(pointer);
      const push = reduced ? 0 : DOTS.strength * (pressed ? DOTS.pressed : 1);
      let moving = false;
      for (const [key, dot] of dots) {
        const target = dot.seen === stepId ? dot.target : 0;
        const [shown, tint] = [dot.shown, dot.tint];
        dot.shown = target > shown ? shown + (target - shown) * DOTS.appear : Math.max(target, shown * DOTS.fade);
        if (pointer && push) {
          const [dx, dy] = [dot.homeX + dot.ox - pointer.x, dot.homeY + dot.oy - pointer.y];
          const dist = Math.hypot(dx, dy);
          if (dist < DOTS.radius && dist > 0) {
            const force = (1 - dist / DOTS.radius) * push;
            dot.vx += (dx / dist) * force;
            dot.vy += (dy / dist) * force;
          }
        }
        dot.vx = (dot.vx - dot.ox * DOTS.returnSpeed) * DOTS.friction;
        dot.vy = (dot.vy - dot.oy * DOTS.returnSpeed) * DOTS.friction;
        dot.ox += dot.vx;
        dot.oy += dot.vy;
        const moved = Math.min(Math.hypot(dot.ox, dot.oy) / DOTS.tintAt, 1);
        dot.tint += (Math.max(moved, pressed ? 1 : 0) - tint) * DOTS.tintSpeed;
        const speed = Math.abs(dot.vx) + Math.abs(dot.vy);
        if (speed > DOTS.still || Math.abs(dot.shown - shown) > DOTS.still || Math.abs(dot.tint - tint) > DOTS.still) moving = true;
        if (dot.shown < DOTS.still && speed < DOTS.still && Math.abs(dot.ox) + Math.abs(dot.oy) < 0.1) dots.delete(key);
      }
      return moving;
    },
  };
}
