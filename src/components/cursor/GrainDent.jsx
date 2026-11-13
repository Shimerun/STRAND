import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/scroll.js';
import { dentImages } from './dentImages.js';

const RADIUS = 100; // px
// Depth of the dent as a share of the full one: while the pointer rests on the page, and with the button held.
// It eases towards the target by EASE of the way per frame.
const DEPTH = { rest: 0.6, pressed: 1 };
const EASE = 0.2;
const SETTLE = 0.005;
const PULL_PX = 10; // at full depth the grain is pulled up to this far towards the middle of the dent
const FILTER_ID = 'grain-dent';
// Near the edge of a band the dent spans two of them; each draws its own part.
const LENSES = 2;
const UNDERLAY = '[data-hero-underlay] > .sticky'; // scaled (and covered by the hero) while the hero is pinned

function createLens(shade) {
  const element = document.createElement('div');
  element.className = 'grain-dent';
  Object.assign(element.style, { width: `${2 * RADIUS}px`, height: `${2 * RADIUS}px` });
  const surface = document.createElement('div');
  surface.className = 'grain-dent-surface';
  surface.style.filter = `url(#${FILTER_ID})`;
  const shading = document.createElement('div');
  shading.className = 'grain-dent-shade';
  shading.style.backgroundImage = `url(${shade})`;
  element.append(surface, shading);
  return { element, surface, shading, host: null };
}

// The band layer the lens sits in, painted the way the page paints it there: the body's grain under the light on
// a base band, the band's own color and grain on a surface band (index.css .band-bg, .band-grain).
function moveInto(lens, host) {
  host.append(lens.element);
  lens.host = host;
  lens.surface.style.backgroundColor = getComputedStyle(host.classList.contains('band-grain') ? host : document.body).backgroundColor;
  lens.surface.dataset.tone = host.classList.contains('band-grain') ? 'surface' : 'base';
}

function place(lens, host, rect, pointer, depth) {
  if (lens.host !== host) moveInto(lens, host);
  const x = pointer.x - rect.left - RADIUS; // lens corner in the band
  const y = pointer.y - rect.top - RADIUS;
  const light = `${-x}px ${-y}px`;
  // The body's grain starts at the top left of the page, a band's own at the top left of the band.
  const grain = lens.surface.dataset.tone === 'surface' ? light : `${-(x + rect.left + window.scrollX)}px ${-(y + rect.top + window.scrollY)}px`;
  lens.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  // Cut off where the lens leaves its band (the band layer itself does not clip).
  const size = 2 * RADIUS;
  const cut = [-y, x + size - rect.width, y + size - rect.height, -x].map((px) => `${Math.max(px, 0)}px`);
  lens.element.style.clipPath = `inset(${cut.join(' ')})`;
  lens.surface.style.setProperty('--dent-light-size', `${rect.width}px ${rect.height}px`);
  lens.surface.style.setProperty('--dent-light-at', light);
  lens.surface.style.setProperty('--dent-grain-at', grain);
  lens.shading.style.opacity = String(depth);
  lens.element.classList.add('is-on');
}

/**
 * Under the custom cursor the grainy wall of the section bands gives like a soft surface: a dent that follows the
 * pointer and deepens while the button is held. It is drawn inside the band's background layer, so the content
 * above stays flat. Mounted with the custom cursor (mouse devices only).
 */
export default function GrainDent() {
  const [images] = useState(() => dentImages(RADIUS, window.devicePixelRatio || 1));
  const displaceRef = useRef(null);

  useEffect(() => {
    const displace = displaceRef.current;
    const instant = prefersReducedMotion();
    const lenses = Array.from({ length: LENSES }, () => createLens(images.shade));
    let bands = [...document.querySelectorAll('.band > .band-bg')];
    const underlay = document.querySelector(UNDERLAY);
    let pointer = null;
    let pressed = false;
    let depth = 0;
    let frame = 0;

    const render = () => {
      frame = 0;
      const target = pointer ? (pressed ? DEPTH.pressed : DEPTH.rest) : 0;
      depth = instant || Math.abs(target - depth) < SETTLE ? target : depth + (target - depth) * EASE;
      displace.setAttribute('scale', String((PULL_PX * depth) / RADIUS)); // in shares of the lens (objectBoundingBox)
      if (bands.some((band) => !band.isConnected)) bands = [...document.querySelectorAll('.band > .band-bg')];
      let used = 0;
      for (const host of pointer ? bands : []) {
        if (used === LENSES) break;
        if (underlay?.style.transform && underlay.contains(host)) continue;
        const rect = host.getBoundingClientRect();
        const near = pointer.x + RADIUS > rect.left && pointer.x - RADIUS < rect.right;
        if (near && pointer.y + RADIUS > rect.top && pointer.y - RADIUS < rect.bottom) place(lenses[used++], host, rect, pointer, depth);
      }
      lenses.slice(used).forEach((lens) => lens.element.classList.remove('is-on'));
      if (depth !== target) frame = requestAnimationFrame(render);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onMove = (event) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const onScroll = () => pointer && schedule();
    const onDown = (event) => {
      pressed = event.button === 0 || pressed;
      schedule();
    };
    const onUp = () => {
      pressed = false;
      schedule();
    };
    const onOut = (event) => {
      if (event.relatedTarget) return;
      pointer = null;
      schedule();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('blur', onUp);
    document.addEventListener('mouseout', onOut);
    return () => {
      cancelAnimationFrame(frame);
      lenses.forEach((lens) => lens.element.remove());
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onUp);
      document.removeEventListener('mouseout', onOut);
    };
  }, [images]);

  // The filter works in shares of the lens box (objectBoundingBox), so the map always covers it exactly.
  return (
    <svg aria-hidden="true" className="grain-dent-defs" width="0" height="0">
      <filter id={FILTER_ID} x="0" y="0" width="1" height="1" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
        <feImage href={images.map} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
        <feDisplacementMap ref={displaceRef} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
