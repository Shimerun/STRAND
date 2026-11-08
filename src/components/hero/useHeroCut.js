import { useEffect } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { HERO_CUT, cutGeometry, cutSoFar, cutState, heroCutPhases } from '../../lib/heroCut.js';

// Once the cut is through, the halves part (shift in frame heights) and swell towards the viewer.
const PART = { top: { y: -0.3, rotate: -2 }, flap: { y: 0.25, rotate: 2 }, zoom: 0.6, goneAt: 0.85 };
const UNDERLAY_FROM = 0.9; // the next section grows from this scale to 1 as it shows through the cut
const PARALLAX = 20; // % of the photo height over the whole hero scroll
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const polygon = (points) => `polygon(${points.map(({ x, y }) => `${x}px ${y}px`).join(', ')})`;

/**
 * Motion values for the hero cut. The top piece keeps everything above the line plus the part not cut yet;
 * the flap is the cut-off part below it, hinged at the cutting point and sagging as the cut grows. Afterwards
 * both swell and part while the next section, pulled up under the pinned frame, shows through the gap.
 */
export function useHeroCut(sectionRef, frameRef, enabled) {
  const { scrollY } = useScroll();
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const pin = useMotionValue(0);

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const next = section.nextElementSibling;
    const measure = () => {
      width.set(frame.offsetWidth);
      height.set(frame.offsetHeight);
      pin.set(Math.max(section.offsetHeight - frame.offsetHeight, 0));
      if (enabled && next) next.style.marginTop = `-${frame.offsetHeight}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(frame);
    return () => {
      observer.disconnect();
      if (next) next.style.marginTop = '';
    };
  }, [sectionRef, frameRef, enabled, width, height, pin]);

  const phases = useTransform([scrollY, pin], ([y, p]) => heroCutPhases(y, p));
  const state = useTransform([phases, width, height], ([phase, w, h]) => (w ? cutState(phase.along, w, h) : null));
  const split = useTransform(phases, (phase) => phase.split);
  const soFar = useTransform([state, width, height], ([s, w, h]) => (s ? cutSoFar(cutGeometry(w, h), s.cutEnd) : null));
  const share = useTransform(state, (s) => s?.share ?? 0);
  const zoomOrigin = useTransform([width, height], ([w, h]) => {
    if (!w) return { x: '50%', y: '50%' };
    const { points } = cutGeometry(w, h);
    return { x: `${w / 2}px`, y: `${points[points.length >> 1].y}px` };
  });

  useMotionValueEvent(split, 'change', (s) => {
    const next = sectionRef.current?.nextElementSibling;
    if (next) next.style.transform = s > 0 && s < 1 ? `scale(${UNDERLAY_FROM + (1 - UNDERLAY_FROM) * s})` : '';
  });

  const swell = useTransform(split, (s) => 1 + PART.zoom * s);
  const hinge = (points, h) => [{ x: points.at(-1).x, y: h }];

  return {
    state,
    share,
    split,
    soFar,
    aim: useTransform(phases, (phase) => phase.aim),
    // Gone once the halves have parted, so the invisible frame never covers the section beneath.
    frameVisibility: useTransform(split, (s) => (s >= 1 ? 'hidden' : 'visible')),
    origin: { x: useTransform(zoomOrigin, (o) => o.x), y: useTransform(zoomOrigin, (o) => o.y) },
    swell,
    backdrop: useTransform(split, [0, 0.25], [1, 0]),
    opacity: useTransform(split, [0, 0.4, PART.goneAt], [1, 1, 0]),
    top: {
      // Unclipped until measured, so the first paint (and the LCP photo) never comes out empty.
      clip: useTransform([soFar, width, height], ([points, w, h]) =>
        points ? polygon([{ x: 0, y: 0 }, { x: w, y: 0 }, ...points, ...hinge(points, h), { x: 0, y: h }]) : 'none',
      ),
      y: useTransform([split, height], ([s, h]) => s * PART.top.y * h),
      rotate: useTransform(split, (s) => s * PART.top.rotate),
    },
    flap: {
      clip: useTransform([soFar, width, height], ([points, w, h]) =>
        points ? polygon([...[...points].reverse(), { x: w, y: h }, ...hinge(points, h)]) : 'none',
      ),
      originX: useTransform(soFar, (points) => (points ? `${points.at(-1).x}px` : '100%')),
      originY: useTransform(soFar, (points) => (points ? `${points.at(-1).y}px` : '50%')),
      y: useTransform([split, height], ([s, h]) => s * PART.flap.y * h),
      rotate: useTransform([share, split], ([c, s]) => HERO_CUT.sag * c ** 1.5 + s * PART.flap.rotate),
      visibility: useTransform(share, (c) => (c > 0 ? 'visible' : 'hidden')),
    },
    parallaxY: useTransform([scrollY, height, pin], ([y, h, p]) => `${clamp01(y / (h + p || 1)) * PARALLAX}%`),
    geometry: useTransform([width, height], ([w, h]) => (w ? cutGeometry(w, h) : null)),
  };
}
