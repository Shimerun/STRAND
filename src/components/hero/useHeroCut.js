import { useRef } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { PORTAL, clamp01, cutGeometry, cutSoFar, cutState, ease, heroCutPhases, heroScale, portalCamera, riseAt } from '../../lib/heroCut.js';
import { FOLD, creaseAt, fallAt, foldAt, foldTransform, folded, wedged } from './paper.js';
import { writePlanes } from './portalPlanes.js';
import { useHeroMeasure } from './useHeroMeasure.js';

// In the flight through the cut (PORTAL) the halves swing away like a pair of doors: the top up (ease-out, frame
// heights) and back about its top edge (`tilt` deg in its own perspective, px), the flap falling like paper (paper.js).
const PART = { top: { y: -0.3, rotate: -3, tilt: 28 }, hinge: { transformPerspective: 1600, originX: 0.5, originY: 0 } };
// The flap sags from the cutting point: `drop` frame heights at the right edge once through (∝ cut²), at most maxTan.
const SAG = { drop: 0.04, maxTan: 0.1 };
// The top piece reaches `overlap` px under the flap (from `below` px under the cutting point down): no hairline.
const SEAM = { overlap: 1.5, below: 4 };
const PARALLAX = 20; // % of the photo height over the whole hero scroll
const polygon = (points) => `polygon(${points.map(({ x, y }) => `${x}px ${y}px`).join(', ')})`;
const started = (points) => points?.length > 1; // the cut has entered the frame

/**
 * Motion values for the hero cut. The top piece keeps everything above the line plus the part not cut yet;
 * the flap is the cut-off part below it, hinged at the cutting point and sagging as the cut grows, so the gap
 * between them opens onto the underlay: the content after the hero, which CSS holds under the frame for the
 * whole pin (see Hero.jsx). Then one camera flies through the cut and the underlay comes up to full size.
 * underlayRef: the sticky element holding that content (absent under reduced motion).
 */
export function useHeroCut(sectionRef, frameRef, underlayRef, enabled) {
  const { scrollY } = useScroll();
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const pin = useMotionValue(0);
  const scene = useRef(null); // the planes of the section under the cut (portalPlanes.js)
  const phases = useTransform([scrollY, pin], ([y, p]) => heroCutPhases(y, p));
  const split = useTransform(phases, (phase) => phase.split);
  const camera = useTransform(split, portalCamera);
  // Where the flight has the section under the cut: camera travel and rise (riseAt); null outside the pin.
  const flight = useTransform([scrollY, pin, camera, height], ([y, p, c, h]) => (p > 0 && y < p ? { c, rise: riseAt(p - y, PORTAL.rise * h) } : null));
  useMotionValueEvent(flight, 'change', (state) => writePlanes(scene.current, state));

  useHeroMeasure({ sectionRef, frameRef, underlayRef, enabled, width, height, pin, flight, scene });

  const state = useTransform([phases, width, height], ([phase, w, h]) => (w ? cutState(phase.along, w, h) : null));
  const soFar = useTransform([state, width, height], ([s, w, h]) => (s ? cutSoFar(cutGeometry(w, h), s.cutEnd) : null));
  const share = useTransform(state, (s) => s?.share ?? 0);
  const flapEdge = useTransform([soFar, state], ([points, s]) => (started(points) ? wedged(points, s.press) : points));
  const fold = useTransform(share, foldAt);
  const fall = useTransform([split, width, height], ([s, w, h]) => fallAt(s, w, h));
  const sag = useTransform([soFar, share, width, height], ([points, sh, w, h]) =>
    started(points) ? Math.min((SAG.drop * h * sh * sh) / Math.max(w - points.at(-1).x, 1), SAG.maxTan) : 0,
  );
  const zoomOrigin = useTransform([width, height], ([w, h]) => {
    if (!w) return { x: '50%', y: '50%' };
    const { points } = cutGeometry(w, h);
    return { x: `${w / 2}px`, y: `${points[points.length >> 1].y}px` };
  });


  return {
    state,
    split,
    soFar,
    size: { width, height },
    camera,
    // The paper the closing blades press around the cutting point (CutMarks).
    crease: useTransform([state, width, height], ([s, w, h]) => (s && w ? creaseAt(cutGeometry(w, h), s) : null)),
    // The strip's edge on screen, sagged and folded, for the cut marks.
    flapLine: useTransform([flapEdge, soFar, sag, fold], ([points, cut, tan, deg]) => (started(cut) ? folded(points, cut, tan, deg) : null)),
    aim: useTransform(phases, (phase) => phase.aim),
    // Gone once the halves have parted, so the invisible frame never covers the section beneath.
    frameVisibility: useTransform(split, (s) => (s >= 1 ? 'hidden' : 'visible')),
    origin: { x: useTransform(zoomOrigin, (o) => o.x), y: useTransform(zoomOrigin, (o) => o.y) },
    swell: useTransform(camera, heroScale),
    top: {
      // Shared with its cut marks, on a wrapper: the clip stays a flat mask inside, no 3D context spans elements.
      motion: {
        y: useTransform([split, height], ([s, h]) => (1 - (1 - s) ** 2) * PART.top.y * h),
        rotate: useTransform(split, (s) => s * PART.top.rotate),
        rotateX: useTransform(split, (s) => -PART.top.tilt * ease(s)),
        ...PART.hinge,
      },
      // Unclipped until measured and until the cut enters the frame, so the first paint and the LCP photo never
      // come out empty.
      clip: useTransform([soFar, width, height], ([points, w, h]) => {
        if (!started(points)) return 'none';
        const { x, y } = points.at(-1);
        const seam = x + SEAM.overlap;
        return polygon([{ x: 0, y: 0 }, { x: w, y: 0 }, ...points, { x: seam, y: y + SEAM.below }, { x: seam, y: h }, { x: 0, y: h }]);
      }),
    },
    flap: {
      clip: useTransform([flapEdge, width, height], ([points, w, h]) =>
        points ? polygon([...[...points].reverse(), { x: w, y: h }, { x: points.at(-1).x, y: h }]) : 'none',
      ),
      // The strip turns away from the light as it lifts: the shade over it (Hero.jsx) comes up with the fold.
      shade: useTransform(fold, (deg) => deg / FOLD.deg),
      // About the cutting point: a skew bends the flap down without moving its edge under the uncut part, and
      // the fold lifts it towards the viewer.
      origin: useTransform(soFar, (points) => (points ? `${points.at(-1).x}px ${points.at(-1).y}px` : '100% 50%')),
      transform: useTransform([soFar, sag, fold], ([cut, tan, deg]) => (started(cut) ? foldTransform(cut, tan, deg) : 'none')),
      visibility: useTransform(soFar, (points) => (started(points) ? 'visible' : 'hidden')),
      // The fall, on a wrapper turning about the strip's middle.
      fall: {
        x: useTransform(fall, (f) => f.x),
        y: useTransform(fall, (f) => f.y),
        rotate: useTransform(fall, (f) => f.rotate),
        rotateX: useTransform(fall, (f) => f.rotateX),
        rotateY: useTransform(fall, (f) => f.rotateY),
        transformPerspective: useTransform(fall, (f) => f.perspective),
      },
    },
    parallaxY: useTransform([scrollY, height, pin], ([y, h, p]) => `${clamp01(y / (h + p || 1)) * PARALLAX}%`),
  };
}
