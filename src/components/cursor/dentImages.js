// Static images for the grain dent under the cursor (GrainDent.jsx), drawn once: the displacement map that pulls
// the grain into the dent and the shading of its walls. A bowl, deepest in the middle, flat again at the rim.

const LIGHT = normalize([-1, -1.2, 1.6]); // from the top left, above the page (x right, y down, z to the viewer)
const SLOPE = 0.6; // steepness of the bowl's walls
// Alpha per unit of shading on the walls turned from the light (dark) and to it (light), and the darkening at the
// bottom of the bowl, which the walls shade from the room around.
const SHADE = { dark: 0.6, light: 0.09, deep: 0.1 };

function normalize([x, y, z]) {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

// How far the grain is pulled towards the middle at r (0 at the middle and at the rim, the most at r = 1/√7);
// it falls off steeply near the rim, so the edge of the dent matches the flat page around it.
const pull = (r) => r * (1 - r * r) ** 3;
const PULL_MAX = pull(1 / Math.sqrt(7));

function draw(size, pixel) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);
  const half = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - half) / half;
      const dy = (y + 0.5 - half) / half;
      const r = Math.hypot(dx, dy);
      image.data.set(pixel(r, r ? dx / r : 0, r ? dy / r : 0), (y * size + x) * 4);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

// feDisplacementMap reads R and G as the offset (0.5 = none): each point samples the grain further out, so the
// grain inside the dent looks drawn in towards its middle.
function mapPixel(r, ux, uy) {
  if (r >= 1) return [128, 128, 128, 255];
  const k = (127 * pull(r)) / PULL_MAX;
  return [Math.round(128 + ux * k), Math.round(128 + uy * k), 128, 255];
}

// Walls lit from the top left: the upper left wall faces away from the light, the lower right one towards it.
function shadePixel(r, ux, uy) {
  if (r >= 1) return [0, 0, 0, 0];
  const rise = SLOPE * 4 * r * (1 - r * r); // slope of the bowl, h = -(1 - r²)²
  const [nx, ny, nz] = normalize([-rise * ux, -rise * uy, 1]);
  const lit = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] - LIGHT[2];
  const deep = SHADE.deep * (1 - r * r) ** 2;
  const wall = Math.min(Math.abs(lit) * (lit < 0 ? SHADE.dark : SHADE.light), 1);
  const white = lit > 0 ? wall : 0; // a light wall over the dark bottom of the bowl
  const alpha = wall + deep * (1 - wall);
  return [255, 255, 255, Math.round(255 * alpha)].map((value, i) => (i < 3 ? Math.round((value * white) / (alpha || 1)) : value));
}

/** Data URLs of the displacement map and the shading for a dent of `radius` CSS px at `scale` pixels per px. */
export function dentImages(radius, scale) {
  const size = Math.round(2 * radius * Math.min(scale, 2));
  return { map: draw(size, mapPixel), shade: draw(size, shadePixel) };
}
