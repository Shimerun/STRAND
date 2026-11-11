import { useLayoutEffect } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { cutGeometry, cutSoFar, cutState, heroCutPhases } from '../../lib/heroCut.js';

// Once the cut is through, the halves fly apart (shift in frame heights) and swell a little: the top springs up
// (ease-out), the flap drops (ease-in, like falling). Both are off screen when the pin ends.
const PART = { top: { y: -0.75, rotate: -3 }, flap: { y: 1, rotate: 6 }, zoom: 0.2 };
// While the cut runs, the flap below it sags from the cutting point: by `drop` of the frame height at the right
// edge once the cut is through (growing with the square of the cut, so it starts gently), never steeper than maxTan.
const SAG = { drop: 0.04, maxTan: 0.1 };
// The top piece reaches `overlap` px under the flap along their shared edge (from `below` px under the cutting
// point down), so no hairline shows between the two.
const SEAM = { overlap: 1.5, below: 4 };
const UNDERLAY_FROM = 0.9; // the next section grows from this scale to 1 as the halves part
const PARALLAX = 20; // % of the photo height over the whole hero scroll
const DEG = 180 / Math.PI;
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const polygon = (points) => `polygon(${points.map(({ x, y }) => `${x}px ${y}px`).join(', ')})`;
const started = (points) => points?.length > 1; // the cut has entered the frame

/**
 * Motion values for the hero cut. The top piece keeps everything above the line plus the part not cut yet;
 * the flap is the cut-off part below it, hinged at the cutting point and sagging as the cut grows, so the gap
 * between them opens onto the underlay: the content after the hero, which CSS holds under the frame for the
 * whole pin (see Hero.jsx). Afterwards the halves fly apart while the underlay grows to full size.
 * underlayRef: the sticky element holding that content (absent under reduced motion).
 */
export function useHeroCut(sectionRef, frameRef, underlayRef, enabled) {
  const { scrollY } = useScroll();
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const pin = useMotionValue(0);

  // A layout effect: the underlay is pulled up before the first paint. Done after it, the whole next section
  // jumped into the screen (hidden under the hero, but a layout shift of 1.0 to Core Web Vitals).
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const underlay = underlayRef.current;
    const wrapper = underlay?.parentElement;
    const measure = () => {
      const pinPx = Math.max(section.offsetHeight - frame.offsetHeight, 0);
      width.set(frame.offsetWidth);
      height.set(frame.offsetHeight);
      pin.set(pinPx);
      if (!enabled || !underlay) return;
      // Up to the top of the hero, beneath it; where the content comes to rest once the pin is over.
      wrapper.style.marginTop = `-${section.offsetHeight}px`;
      underlay.dataset.restTop = String(section.offsetTop + pinPx);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(frame);
    return () => {
      observer.disconnect();
      if (!underlay) return;
      wrapper.style.marginTop = '';
      delete underlay.dataset.restTop;
      Object.assign(underlay.style, { transform: '', transformOrigin: '', willChange: '' });
    };
  }, [sectionRef, frameRef, underlayRef, enabled, width, height, pin]);

  const phases = useTransform([scrollY, pin], ([y, p]) => heroCutPhases(y, p));
  const state = useTransform([phases, width, height], ([phase, w, h]) => (w ? cutState(phase.along, w, h) : null));
  const split = useTransform(phases, (phase) => phase.split);
  const soFar = useTransform([state, width, height], ([s, w, h]) => (s ? cutSoFar(cutGeometry(w, h), s.cutEnd) : null));
  const share = useTransform(state, (s) => s?.share ?? 0);
  const sag = useTransform([soFar, share, width, height], ([points, sh, w, h]) =>
    started(points) ? Math.min((SAG.drop * h * sh * sh) / Math.max(w - points.at(-1).x, 1), SAG.maxTan) : 0,
  );
  const zoomOrigin = useTransform([width, height], ([w, h]) => {
    if (!w) return { x: '50%', y: '50%' };
    const { points } = cutGeometry(w, h);
    return { x: `${w / 2}px`, y: `${points[points.length >> 1].y}px` };
  });

  // Under the frame the underlay is a bit smaller, so the gap shows it at a distance; it grows to full size as
  // the halves part. Only the scale is scripted (its place is held by CSS), and as a string, so the style is
  // written when the scale changes, not on every scroll frame. While scaled it is a layer of its own (otherwise
  // every frame of the split repaints the whole screen, which Safari on a phone cannot keep up with); once the
  // pin is over the layer goes, so the text comes back crisp at full size.
  const underlayScale = useTransform([scrollY, pin, split], ([y, p, s]) =>
    p > 0 && y < p ? `scale(${UNDERLAY_FROM + (1 - UNDERLAY_FROM) * s})` : '',
  );
  useMotionValueEvent(underlayScale, 'change', (transform) => {
    const underlay = underlayRef.current;
    if (!underlay) return;
    underlay.style.transform = transform;
    underlay.style.transformOrigin = transform ? `50% ${height.get() / 2}px` : '';
    underlay.style.willChange = transform ? 'transform' : '';
  });

  const swell = useTransform(split, (s) => 1 + PART.zoom * s);
  const hinge = (points, h) => [{ x: points.at(-1).x, y: h }];

  return {
    state,
    share,
    split,
    soFar,
    sag,
    aim: useTransform(phases, (phase) => phase.aim),
    // Gone once the halves have parted, so the invisible frame never covers the section beneath.
    frameVisibility: useTransform(split, (s) => (s >= 1 ? 'hidden' : 'visible')),
    origin: { x: useTransform(zoomOrigin, (o) => o.x), y: useTransform(zoomOrigin, (o) => o.y) },
    swell,
    top: {
      // Unclipped until measured and until the cut enters the frame, so the first paint and the LCP photo never
      // come out empty.
      clip: useTransform([soFar, width, height], ([points, w, h]) => {
        if (!started(points)) return 'none';
        const { x, y } = points.at(-1);
        const seam = x + SEAM.overlap;
        return polygon([{ x: 0, y: 0 }, { x: w, y: 0 }, ...points, { x: seam, y: y + SEAM.below }, { x: seam, y: h }, { x: 0, y: h }]);
      }),
      y: useTransform([split, height], ([s, h]) => (1 - (1 - s) ** 2) * PART.top.y * h),
      rotate: useTransform(split, (s) => s * PART.top.rotate),
    },
    flap: {
      clip: useTransform([soFar, width, height], ([points, w, h]) =>
        points ? polygon([...[...points].reverse(), { x: w, y: h }, ...hinge(points, h)]) : 'none',
      ),
      originX: useTransform(soFar, (points) => (points ? `${points.at(-1).x}px` : '100%')),
      originY: useTransform(soFar, (points) => (points ? `${points.at(-1).y}px` : '50%')),
      y: useTransform([split, height], ([s, h]) => s * s * PART.flap.y * h),
      rotate: useTransform(split, (s) => s * PART.flap.rotate),
      // A skew about the cutting point bends the flap down without moving its edge under the uncut part.
      skewY: useTransform(sag, (tan) => Math.atan(tan) * DEG),
      visibility: useTransform(soFar, (points) => (started(points) ? 'visible' : 'hidden')),
    },
    parallaxY: useTransform([scrollY, height, pin], ([y, h, p]) => `${clamp01(y / (h + p || 1)) * PARALLAX}%`),
    geometry: useTransform([width, height], ([w, h]) => (w ? cutGeometry(w, h) : null)),
  };
}
