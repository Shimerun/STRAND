import { useLayoutEffect, useRef } from 'react';
import Shears2D, { SVG } from '../scissors/Shears2D.jsx';

const BLADE_UNITS = 156; // pivot to tip in Shears2D units
const BLADE_PX = 40; // on the ticket
const SCALE = BLADE_PX / BLADE_UNITS;
const SNIP_PX = 80; // ticket width per snip
const DURATION_MS = 1700;
const MAX_OPEN = 22; // degrees per half

/**
 * The site's flat shears cutting along the perforation from left to right: they travel steadily and snip,
 * and the cut (a solid hairline) grows to where the blades meet. Calls onDone once they are past the edge.
 */
export default function TicketSnip({ width, onDone }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const halfARef = useRef(null);
  const halfBRef = useRef(null);
  const lineRef = useRef(null);

  // Layout effect: the shears are scaled down before the first paint, never shown full size.
  useLayoutEffect(() => {
    if (!width) return undefined;
    // Pivot at the wrapper origin, blades pointing right (Shears2D draws them pointing up).
    svgRef.current.style.transform = `translate3d(${-SVG.cx}px, ${-SVG.cy}px, 0) rotate(90deg) scale(${SCALE})`;
    const snips = Math.max(3, Math.round(width / SNIP_PX));
    const start = performance.now();
    let cut = 0;
    let frame = 0;

    const tick = (now) => {
      const t = Math.min((now - start) / DURATION_MS, 1);
      const pivot = -BLADE_PX + t * (width + 2 * BLADE_PX);
      const open = 0.5 + 0.5 * Math.cos(2 * Math.PI * t * snips); // 1 = wide open, 0 = shut
      cut = Math.max(cut, Math.min(pivot + BLADE_PX * (1 - open), width));
      wrapRef.current.style.transform = `translate3d(${pivot}px, 0, 0)`;
      halfARef.current.setAttribute('transform', `rotate(${-MAX_OPEN * open} ${SVG.pivot})`);
      halfBRef.current.setAttribute('transform', `rotate(${MAX_OPEN * open} ${SVG.pivot})`);
      lineRef.current.style.transform = `scaleX(${cut / width})`;
      if (t < 1) frame = requestAnimationFrame(tick);
      else onDone();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [width, onDone]);

  return (
    <>
      <div ref={lineRef} className="absolute inset-x-0 top-0 h-px origin-left bg-text" style={{ transform: 'scaleX(0)' }} />
      <div ref={wrapRef} className="absolute left-0 top-0" style={{ transform: `translate3d(${-BLADE_PX}px, 0, 0)` }}>
        <Shears2D svgRef={svgRef} halfARef={halfARef} halfBRef={halfBRef} />
      </div>
    </>
  );
}
