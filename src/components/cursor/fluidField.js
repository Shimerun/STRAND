// A small height field that follows the pointer over the page, for the grain dent (GrainDent.jsx): the pointer
// presses into it like a finger into thick paint, pushing the material it displaces into a swell around itself;
// dragged along it ploughs a groove with ridges at its sides, which flows back together and levels out once the
// pointer has passed (or the page has scrolled on under it). A damped wave equation on a grid, heights in px.
// The surface steps 60 times a second (GrainDent.jsx), so "per step" below is per 1/60 s.

// Everything that sets how the surface moves; tune here.
export const FLOW = {
  relax: 0.88, // height kept per step: how fast a groove fades. 0.88 → gone in about 0.4 s; 0.988 → over a second
  damp: 0.8, // speed kept per step: lower kills the ripples sooner (0.92 let them roll on)
  dampReduced: 0.6, // the same under prefers-reduced-motion
  wave: 0.015, // pull of a cell towards its neighbours per step: how far the surface spreads and ripples (≤ 0.5)
  radius: 24, // px: width of the dent under the pointer
  sharpness: 3, // falloff of its edge: 2 is a soft Gaussian, higher is a firmer edge
  grip: 0.85, // share of the way to the full dent the cells under the pointer move per step: how fast it follows
  maxDig: 4, // px a cell can be pressed down per step: caps what a fast stroke churns up
  ring: 1.6, // the swell of pushed-aside material sits this many radii out…
  ringWidth: 0.55, // …and is this many radii wide
  reach: 3, // radii around the pointer it presses and piles over
  still: 0.002, // px: below this change per step everywhere the surface is at rest and stops
};

export const FIELD = { cells: 72, cell: 5 }; // the field covers cells × cell px around the pointer

/** reduced: prefers-reduced-motion. Returns { h, ox, oy, moveTo(x, y), step(x, y, depth) } in page px. */
export function createField(reduced) {
  const n = FIELD.cells;
  const { cell } = FIELD;
  const damp = reduced ? FLOW.dampReduced : FLOW.damp;
  const h = new Float32Array(n * n);
  const v = new Float32Array(n * n);
  const spare = new Float32Array(n * n);
  const before = new Float32Array(n * n);
  const field = { h, ox: null, oy: null };

  // Moves the values by whole cells as the grid follows the pointer; what comes in from the edge is flat.
  function shift(values, dx, dy) {
    spare.fill(0);
    for (let j = 0; j < n; j++) {
      const sj = j + dy;
      if (sj < 0 || sj >= n) continue;
      for (let i = 0; i < n; i++) {
        const si = i + dx;
        if (si >= 0 && si < n) spare[j * n + i] = values[sj * n + si];
      }
    }
    values.set(spare);
  }

  /** Keeps the pointer (page px) in the middle of the grid, which moves in whole cells. */
  field.moveTo = (x, y) => {
    const ox = (Math.round(x / cell) - n / 2) * cell;
    const oy = (Math.round(y / cell) - n / 2) * cell;
    if (field.ox !== null) {
      const [dx, dy] = [(ox - field.ox) / cell, (oy - field.oy) / cell];
      if (Math.abs(dx) >= n || Math.abs(dy) >= n) {
        h.fill(0);
        v.fill(0);
      } else if (dx || dy) {
        shift(h, dx, dy);
        shift(v, dx, dy);
      }
    }
    field.ox = ox;
    field.oy = oy;
  };

  /**
   * One step with the pointer at page px (x, y) pressing `depth` px deep (0: not pressing). True while the surface
   * still moves: a dent held under a resting pointer settles (pressing and levelling out balance) and stops.
   */
  field.step = (x, y, depth) => {
    before.set(h);
    for (let j = 1; j < n - 1; j++) {
      for (let i = 1; i < n - 1; i++) {
        const k = j * n + i;
        v[k] = (v[k] + FLOW.wave * (h[k - 1] + h[k + 1] + h[k - n] + h[k + n] - 4 * h[k])) * damp;
      }
    }
    for (let k = 0; k < n * n; k++) h[k] = (h[k] + v[k]) * FLOW.relax;
    if (depth > 0) press((x - field.ox) / cell, (y - field.oy) / cell, depth);
    let change = 0;
    for (let k = 0; k < n * n; k++) change = Math.max(change, Math.abs(h[k] - before[k]));
    return change > FLOW.still;
  };

  // Presses the cells under the pointer (grid units) towards a dent `depth` px deep and adds the volume pressed
  // out to the swell around it, so nothing is lost: it has to flow back.
  function press(cx, cy, depth) {
    const r = FLOW.radius / cell;
    const ring = FLOW.ring * r;
    const ringWidth = FLOW.ringWidth * r;
    const reach = Math.ceil(r * FLOW.reach);
    const [j0, j1] = [Math.max(Math.round(cy) - reach, 1), Math.min(Math.round(cy) + reach, n - 2)];
    const [i0, i1] = [Math.max(Math.round(cx) - reach, 1), Math.min(Math.round(cx) + reach, n - 2)];
    let pressed = 0;
    let swell = 0;
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy); // from cell centres
        const w = Math.exp(-((d / r) ** FLOW.sharpness));
        const k = j * n + i;
        const down = Math.min(Math.max(h[k] + depth * w, 0) * FLOW.grip * w, FLOW.maxDig); // only deeper, capped
        h[k] -= down;
        pressed += down;
        swell += Math.exp(-(((d - ring) / ringWidth) ** 2));
      }
    }
    if (!pressed) return;
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy);
        h[j * n + i] += (pressed * Math.exp(-(((d - ring) / ringWidth) ** 2))) / swell;
      }
    }
  }

  return field;
}
