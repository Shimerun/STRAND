import { useEffect } from 'react';
import { prefersReducedMotion } from '../../lib/scroll.js';
import { createField } from './fluidField.js';
import { bandLook, describeBand, loadGrain } from './bandLook.js';
import { LENS_PX, createLens } from './fluidLens.js';

const DEPTH = { rest: 11, pressed: 20 }; // px the pointer presses into the wall: resting on it, button held
const STEP_MS = 1000 / 60; // the surface steps at 60 Hz whatever the display's rate
const MAX_STEPS = 3; // after a stall it catches up at most this many steps
const LENSES = 2; // near the edge of a band the surface spans two of them; each draws its own part
const UNDERLAY = '[data-hero-underlay] > .sticky'; // scaled (and covered by the hero) while the hero is pinned
/**
 * Under the custom cursor the grainy wall of the section bands behaves like a thick liquid: the pointer presses a
 * dent into it (deeper with the button held) and as it moves on, or the page scrolls under it, the surface flows
 * back and ripples out (fluidField.js). Drawn inside the bands' background layer by WebGL lenses (fluidLens.js),
 * so the content above stays flat. Mounted with the custom cursor (mouse devices only); nothing without WebGL2.
 */
export default function GrainDent() {
  useEffect(() => {
    let lenses = null; // made on the first mouse move, so a page nobody points at holds no WebGL contexts
    let unsupported = false;
    const field = createField(prefersReducedMotion());
    const bandInfo = new Map();
    const underlay = document.querySelector(UNDERLAY);
    let bands = [...document.querySelectorAll('.band > .band-bg')];
    let pointer = null; // viewport px and whether it is on the page
    let pressed = false;
    let moving = false;
    let frame = 0;
    let last = 0;
    let carry = 0;

    const paint = (lens, host, rect) => {
      if (lens.host !== host) {
        host.append(lens.element);
        lens.host = host;
      }
      if (!bandInfo.has(host)) bandInfo.set(host, describeBand(host));
      const page = [rect.left + window.scrollX, rect.top + window.scrollY];
      const origin = [field.ox - page[0], field.oy - page[1]]; // lens corner in the band
      const cut = [-origin[1], origin[0] + LENS_PX - rect.width, origin[1] + LENS_PX - rect.height, -origin[0]];
      Object.assign(lens.element.style, {
        transform: `translate3d(${origin[0]}px, ${origin[1]}px, 0)`,
        clipPath: `inset(${cut.map((px) => `${Math.max(px, 0)}px`).join(' ')})`, // the band layer does not clip
        visibility: 'visible',
      });
      lens.draw(field.h, bandLook(bandInfo.get(host), rect, origin, page));
    };

    const tick = (now) => {
      frame = 0;
      carry += last ? Math.min(now - last, STEP_MS * MAX_STEPS) : STEP_MS;
      last = now;
      const [x, y] = [pointer.x + window.scrollX, pointer.y + window.scrollY];
      field.moveTo(x, y);
      if (bands.some((band) => !band.isConnected)) bands = [...document.querySelectorAll('.band > .band-bg')];
      const [left, top] = [field.ox - window.scrollX, field.oy - window.scrollY]; // the surface's corner on screen
      let inside = false;
      const hits = [];
      for (const host of bands) {
        if (underlay?.style.transform && underlay.contains(host)) continue;
        const rect = host.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x < rect.right && pointer.y >= rect.top && pointer.y < rect.bottom) inside = true;
        const near = left < rect.right && left + LENS_PX > rect.left && top < rect.bottom && top + LENS_PX > rect.top;
        if (near && hits.length < LENSES) hits.push([host, rect]);
      }
      const depth = pointer.on && inside ? (pressed ? DEPTH.pressed : DEPTH.rest) : 0;
      for (; carry >= STEP_MS; carry -= STEP_MS) moving = field.step(x, y, depth);
      hits.forEach(([host, rect], i) => paint(lenses[i], host, rect));
      lenses.slice(hits.length).forEach((lens) => {
        lens.element.style.visibility = 'hidden';
      });
      if (moving) frame = requestAnimationFrame(tick);
      else last = 0; // at rest: no loop until the pointer or the page moves again
    };
    const nudge = () => {
      if (!pointer || !lenses) return;
      moving = true;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const start = () => {
      try {
        lenses = Array.from({ length: LENSES }, createLens);
      } catch (error) {
        console.warn('GrainDent: no WebGL lens', error);
      }
      if (!lenses || lenses.some((lens) => !lens)) {
        lenses?.forEach((lens) => lens?.dispose());
        lenses = null;
        unsupported = true; // no WebGL2: the bands stay flat
        return;
      }
      const ready = lenses;
      loadGrain(ready[0].element.width / LENS_PX).then(
        ({ grain, tile }) => {
          ready.forEach((lens) => lens.setGrain(grain, tile));
          nudge();
        },
        (error) => console.warn(error.message),
      );
    };

    const onMove = (event) => {
      if (event.pointerType !== 'mouse' || unsupported) return;
      pointer = { x: event.clientX, y: event.clientY, on: true };
      if (!lenses) start();
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
      pointer.on = false; // the surface flows back where the pointer left it
      nudge();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', nudge, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('blur', onUp);
    document.addEventListener('mouseout', onOut);
    return () => {
      cancelAnimationFrame(frame);
      lenses?.forEach((lens) => lens.dispose());
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', nudge);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onUp);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return null;
}
