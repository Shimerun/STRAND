// What the grain dent's lenses (fluidLens.js) need to repaint a section band exactly as index.css paints it.

// The pool of light a band paints (index.css .band --light): at --light-x across and 300 px down, 70% × 300 px.
const LIGHT = { y: 300, rx: 0.7, ry: 300, alpha: 0.055 };
const GRAIN_TILE = 180; // px, index.css --grain-size

const rgb = (css) => css.match(/[\d.]+/g).slice(0, 3).map((value) => Number(value) / 255);

// The grain tile (index.css --grain, an SVG noise) drawn at device pixels, for the lenses to paint with.
export function loadGrain(scale) {
  const source = getComputedStyle(document.documentElement).getPropertyValue('--grain').trim().match(/^url\(["']?(.*?)["']?\)$/s);
  return new Promise((resolve, reject) => {
    if (!source) throw new Error('GrainDent: --grain is not a url()');
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(GRAIN_TILE * scale);
      canvas.height = canvas.width;
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve({ grain: canvas, tile: GRAIN_TILE });
    };
    image.onerror = () => reject(new Error('GrainDent: the grain image did not load'));
    image.src = source[1];
  });
}

/** How a band layer is painted (index.css .band-bg, .band-grain); read once per band. */
export function describeBand(host) {
  const surface = host.classList.contains('band-grain');
  return {
    tone: surface ? 'surface' : 'base',
    base: rgb(getComputedStyle(surface ? host : document.body).backgroundColor),
    lightX: parseFloat(getComputedStyle(host.parentElement).getPropertyValue('--light-x')) / 100,
  };
}

/**
 * Draw parameters for a lens in a band: look from describeBand, rect: the band layer on screen, origin: the lens
 * corner in the band, page: the band's top left on the page (px).
 */
export function bandLook({ tone, base, lightX }, rect, origin, page) {
  return {
    origin,
    grainShift: tone === 'surface' ? origin : [origin[0] + page[0], origin[1] + page[1]], // the body's grain on a base band
    tone,
    base,
    lightC: [lightX * rect.width, LIGHT.y],
    lightR: [LIGHT.rx * rect.width, LIGHT.ry],
    lightA: LIGHT.alpha,
  };
}
