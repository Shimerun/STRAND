import { useEffect } from 'react';
import { prefersReducedMotion } from '../../lib/scroll.js';
import { DOTS, SHADES, createDots } from './dotGrid.js';
import { lightIn } from './bandLight.js';

const LENS_PX = 600; // each canvas covers this square around the pointer; a trail fades out at its edge
const EDGE_PX = 80; // over this far in from the canvas edge
const MAX_DPR = 2;
const STEP_MS = 1000 / 60; // the dots step at 60 Hz whatever the display's rate
const MAX_STEPS = 3; // after a stall they catch up at most this many steps
const LENSES = 2; // near the edge of a band the trail spans two of them; each draws its own part
const UNDERLAY = '[data-hero-underlay] > .sticky'; // scaled (and covered by the hero) while the hero is pinned
const TAU = Math.PI * 2;

function createLens() {
  const canvas = document.createElement('canvas');
  canvas.className = 'dot-trail';
  const scale = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(LENS_PX * scale);
  canvas.height = canvas.width;
  Object.assign(canvas.style, { width: `${LENS_PX}px`, height: `${LENS_PX}px` });
  return { element: canvas, context: canvas.getContext('2d'), scale, host: null };
}

// Draws the dots that fall in the lens: a square LENS_PX wide centred on the pointer (page px), in band `host`.
function draw(lens, host, rect, dots, pointer) {
  if (lens.host !== host) {
    host.append(lens.element);
    lens.host = host;
  }
  const page = [rect.left + window.scrollX, rect.top + window.scrollY];
  const corner = [pointer.x - LENS_PX / 2, pointer.y - LENS_PX / 2]; // page px
  const origin = [corner[0] - page[0], corner[1] - page[1]]; // in the band
  const cut = [-origin[1], origin[0] + LENS_PX - rect.width, origin[1] + LENS_PX - rect.height, -origin[0]];
  Object.assign(lens.element.style, {
    transform: `translate3d(${origin[0]}px, ${origin[1]}px, 0)`,
    clipPath: `inset(${cut.map((px) => `${Math.max(px, 0)}px`).join(' ')})`, // the band layer does not clip
    visibility: 'visible',
  });
  const { context, scale } = lens;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, lens.element.width, lens.element.height);
  context.setTransform(scale, 0, 0, scale, -corner[0] * scale, -corner[1] * scale);
  const lit = lightIn(host, rect);
  for (const dot of dots.values()) {
    const [x, y] = [dot.homeX + dot.ox, dot.homeY + dot.oy];
    const edge = Math.min(x - corner[0], y - corner[1], corner[0] + LENS_PX - x, corner[1] + LENS_PX - y);
    if (edge <= 0 || dot.shown <= 0) continue;
    const glow = DOTS.shade + (1 - DOTS.shade) * lit(x, y); // brighter in the band's light spot
    context.globalAlpha = DOTS.opacity * glow * dot.shown * Math.min(edge / EDGE_PX, 1);
    context.fillStyle = SHADES[Math.round(Math.min(dot.tint, 1) * (SHADES.length - 1))];
    context.beginPath();
    context.arc(x, y, DOTS.size, 0, TAU);
    context.fill();
  }
  context.globalAlpha = 1;
}

/**
 * Under the custom cursor, concrete-grey dots show up on the section bands around the pointer, shy away from it
 * (harder with the button held, both turning them green) and ease back home, fading out behind it, also when the
 * page scrolls under it (dotGrid.js); they are brighter in the band's light spot (bandLight.js). Drawn inside the
 * bands' background layer (index.css .band-bg), so the content above is untouched, and only while something
 * moves. Mounted with the custom cursor (mouse devices only).
 */
export default function DotTrail() {
  useEffect(() => {
    const grid = createDots(prefersReducedMotion());
    const underlay = document.querySelector(UNDERLAY);
    let lenses = null; // made on the first mouse move
    let bands = [...document.querySelectorAll('.band > .band-bg')];
    let pointer = null; // viewport px and whether it is on the page
    let pressed = false;
    let moving = false;
    let [frame, last, carry] = [0, 0, 0];

    const tick = (now) => {
      frame = 0;
      carry += last ? Math.min(now - last, STEP_MS * MAX_STEPS) : STEP_MS;
      last = now;
      const page = { x: pointer.x + window.scrollX, y: pointer.y + window.scrollY };
      if (bands.some((band) => !band.isConnected)) bands = [...document.querySelectorAll('.band > .band-bg')];
      const half = LENS_PX / 2;
      let inside = false;
      const hits = [];
      for (const host of bands) {
        if (underlay?.style.transform && underlay.contains(host)) continue;
        const rect = host.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x < rect.right && pointer.y >= rect.top && pointer.y < rect.bottom) inside = true;
        const near = pointer.x - half < rect.right && pointer.x + half > rect.left && pointer.y - half < rect.bottom && pointer.y + half > rect.top;
        if (near && hits.length < LENSES) hits.push([host, rect]);
      }
      const active = pointer.on && inside ? page : null; // dots show up only over a band
      for (; carry >= STEP_MS; carry -= STEP_MS) moving = grid.step(active, pressed);
      hits.forEach(([host, rect], i) => draw(lenses[i], host, rect, grid.dots, page));
      for (const lens of lenses.slice(hits.length)) lens.element.style.visibility = 'hidden';
      if (moving) frame = requestAnimationFrame(tick);
      else last = 0; // at rest: no loop until the pointer or the page moves again
    };
    const nudge = () => {
      if (!pointer) return;
      moving = true;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY, on: true };
      lenses ??= Array.from({ length: LENSES }, createLens);
      nudge();
    };
    const onDown = (event) => {
      pressed = event.button === 0 || pressed;
      nudge();
    };
    const onUp = () => {
      pressed = false;
      nudge();
    };
    const onOut = (event) => {
      if (event.relatedTarget || !pointer) return;
      pointer.on = false; // the dots settle and fade where the pointer left them
      nudge();
    };

    const events = { pointermove: onMove, scroll: nudge, pointerdown: onDown, pointerup: onUp, blur: onUp };
    Object.entries(events).forEach(([type, handler]) => window.addEventListener(type, handler, { passive: true }));
    document.addEventListener('mouseout', onOut);
    return () => {
      cancelAnimationFrame(frame);
      lenses?.forEach((lens) => lens.element.remove());
      Object.entries(events).forEach(([type, handler]) => window.removeEventListener(type, handler));
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return null;
}
