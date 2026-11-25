import { createContext } from 'react';
import { PORTAL, clamp01, ease, planeScale } from '../../lib/heroCut.js';

const TURN_PERSPECTIVE = 1200; // px, the perspective a plane turns in

/** Camera travel 0..1 of the flight through the cut (a motion value), for what lies under it; null elsewhere. */
export const PortalCamera = createContext(null);

// Position of `el` in the box of `ancestor` (an offset parent up its chain): layout only, so transforms already on it
// never skew the measure.
function offsetIn(el, ancestor) {
  let left = 0;
  let top = 0;
  for (let node = el; node && node !== ancestor; node = node.offsetParent) {
    left += node.offsetLeft;
    top += node.offsetTop;
  }
  return { left, top };
}

/**
 * The planes the section under the cut flies in as (its elements marked data-portal="photo" | "text", see PORTAL in
 * heroCut.js) and its band (Section's .band-bg). Measured on resize, in the box of the underlay (which CSS holds at
 * the top of the screen during the pin), so the flight itself reads nothing from the page.
 */
export function readPlanes(underlay, width, height) {
  const planes = [...underlay.querySelectorAll('[data-portal]')].map((el) => {
    const { left, top } = offsetIn(el, underlay);
    return {
      el,
      ...PORTAL.planes[el.dataset.portal],
      // Each scales about the middle of the screen, and turns about its own middle (from there, px).
      origin: `${(width / 2 - left).toFixed(1)}px ${(height / 2 - top).toFixed(1)}px`,
      cx: left + el.offsetWidth / 2 - width / 2,
      cy: top + el.offsetHeight / 2 - height / 2,
      last: null,
    };
  });
  return { planes, band: underlay.querySelector('.band-bg'), lastBand: null };
}

/**
 * Puts the planes where camera travel `c` and `rise` px (riseAt) have them; null puts everything back as CSS has it
 * (the pin is over, or the hero is gone). Writes a style only when it changes.
 */
export function writePlanes(scene, state) {
  if (!scene) return;
  for (const plane of scene.planes) {
    const { el, z, turn, pull, show, origin, cx, cy } = plane;
    let next = '';
    if (state) {
      const away = 1 - state.c;
      const angle = turn * away;
      const swing = angle ? ` translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) perspective(${TURN_PERSPECTIVE}px) rotateY(${angle.toFixed(2)}deg) translate(${(-cx).toFixed(1)}px, ${(-cy).toFixed(1)}px)` : '';
      const toMiddle = pull * away;
      next = `translate3d(${(-cx * toMiddle).toFixed(1)}px, ${(state.rise - cy * toMiddle).toFixed(1)}px, 0) scale(${planeScale(state.c, z).toFixed(4)})${swing}`;
    }
    const opacity = state && show ? ease(clamp01((state.c - show[0]) / (show[1] - show[0]))).toFixed(3) : '';
    if (plane.last === next + opacity) continue;
    plane.last = next + opacity;
    Object.assign(el.style, { transform: next, transformOrigin: next ? origin : '', opacity, willChange: next ? 'transform' : '' });
  }
  const band = state ? (PORTAL.wall + (1 - PORTAL.wall) * state.c).toFixed(3) : '';
  if (scene.band && scene.lastBand !== band) {
    scene.lastBand = band;
    Object.assign(scene.band.style, { opacity: band, willChange: band ? 'opacity' : '' });
  }
}
