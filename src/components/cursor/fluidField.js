// A small height field that follows the pointer over the page, for the grain dent (GrainDent.jsx): the pointer
// presses into it like a finger into thick paint, pushing the material it displaces into a swell around itself;
// dragged along it ploughs a groove with ridges at its sides, which flows back together and levels out once the
// pointer has passed (or the page has scrolled on under it). A damped wave equation on a grid, heights in px.

export const FIELD = { cells: 72, cell: 5 }; // the field covers cells × cell px around the pointer
const WAVE = 0.04; // pull of a cell towards its neighbours per step (at most 0.5, or the grid blows up): low is thick
const DAMP = { flow: 0.92, reduced: 0.6 }; // velocity kept per step: lower is thicker; reduced motion: no ripples
const RELAX = 0.988; // height kept per step: a groove left behind levels out over about a second
// The pointer presses a dent `radius` px wide, pulling the cells a share `grip` of the way down to it per step,
// and piles what it pressed out into a swell `ring` radii out and `ringWidth` radii wide.
const PRESS = { radius: 34, grip: 0.55, ring: 1.6, ringWidth: 0.55, reach: 3 };
const STILL = 0.002; // px: below this change per step everywhere the surface is at rest

/** reduced: prefers-reduced-motion. Returns { h, ox, oy, moveTo(x, y), step(x, y, depth) } in page px. */
export function createField(reduced) {
  const n = FIELD.cells;
  const { cell } = FIELD;
  const damp = reduced ? DAMP.reduced : DAMP.flow;
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
        v[k] = (v[k] + WAVE * (h[k - 1] + h[k + 1] + h[k - n] + h[k + n] - 4 * h[k])) * damp;
      }
    }
    for (let k = 0; k < n * n; k++) h[k] = (h[k] + v[k]) * RELAX;
    if (depth > 0) press((x - field.ox) / cell, (y - field.oy) / cell, depth);
    let change = 0;
    for (let k = 0; k < n * n; k++) change = Math.max(change, Math.abs(h[k] - before[k]));
    return change > STILL;
  };

  // Presses the cells under the pointer (grid units) towards a dent `depth` px deep and adds the volume pressed
  // out to the swell around it, so nothing is lost: it has to flow back.
  function press(cx, cy, depth) {
    const r = PRESS.radius / cell;
    const ring = PRESS.ring * r;
    const ringWidth = PRESS.ringWidth * r;
    const reach = Math.ceil(r * PRESS.reach);
    const [j0, j1] = [Math.max(Math.round(cy) - reach, 1), Math.min(Math.round(cy) + reach, n - 2)];
    const [i0, i1] = [Math.max(Math.round(cx) - reach, 1), Math.min(Math.round(cx) + reach, n - 2)];
    let pressed = 0;
    let swell = 0;
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy); // from cell centres
        const w = Math.exp(-((d / r) ** 2));
        const k = j * n + i;
        const down = Math.max(h[k] + depth * w, 0) * PRESS.grip * w; // only ever deeper, towards the dent
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
