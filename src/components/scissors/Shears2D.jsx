import { useId } from 'react';

// Flat stand-in for the 3D model: blades up, long axis vertical, halves hinged at the pivot.
// cx / cy: shape centre (the 3D pivot is the bounding-box centre too); length: tip to ring bottom.
const PIVOT = { x: 60, y: 160 };
export const SVG = { width: 120, height: 328, cx: 60, cy: 164, length: 318, blade: 156, pivot: `${PIVOT.x} ${PIVOT.y}` };

const STEEL = [['0', '#5d636b'], ['0.35', '#eef0f2'], ['0.6', '#a7adb4'], ['1', '#3f444a']];
const HANDLE = [['0', '#3a3d42'], ['0.5', '#0b0b0c'], ['1', '#2b2d31']];
const SHADOW = 'drop-shadow(0 10px 14px rgba(0, 0, 0, 0.55))';

// Each half: blade on one side of the axis, shank and ring on the other. [blade, highlight, shank, ring cx].
const HALVES = {
  a: ['M60 4 Q51 70 50 148 Q52 160 60 164 Z', 'M60 6 Q51.5 70 50.6 146', 'M60 160 L81 272', 86],
  b: ['M60 4 Q69 70 70 148 Q68 160 60 164 Z', 'M60 6 Q68.5 70 69.4 146', 'M60 160 L39 272', 34],
};
const RING = { cy: 296, r: 22, stroke: 8 };

function Gradient({ id, stops, vertical = false }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
      {stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} stopColor={color} />
      ))}
    </linearGradient>
  );
}

function Half({ half, steel, handle, halfRef }) {
  const [blade, highlight, shank, ringX] = HALVES[half];
  return (
    <g ref={halfRef}>
      <path d={shank} fill="none" stroke={`url(#${handle})`} strokeWidth="9" strokeLinecap="round" />
      <circle cx={ringX} cy={RING.cy} r={RING.r} fill="none" stroke={`url(#${handle})`} strokeWidth={RING.stroke} />
      <path d={blade} fill={`url(#${steel})`} />
      <path d={highlight} fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

/** The SVG shears. svgRef, halfARef, halfBRef receive the elements the caller moves and opens. */
export default function Shears2D({ svgRef, halfARef, halfBRef }) {
  const id = useId().replace(/:/g, '');
  const steel = `${id}-steel`;
  const handle = `${id}-handle`;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG.width} ${SVG.height}`}
      width={SVG.width}
      height={SVG.height}
      className="absolute left-0 top-0 overflow-visible"
      style={{ transformOrigin: `${SVG.cx}px ${SVG.cy}px`, filter: SHADOW }}
    >
      <defs>
        <Gradient id={steel} stops={STEEL} />
        <Gradient id={handle} stops={HANDLE} vertical />
      </defs>
      <Half half="b" steel={steel} handle={handle} halfRef={halfBRef} />
      <Half half="a" steel={steel} handle={handle} halfRef={halfARef} />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="5.5" strokeWidth="1.5" className="fill-accent stroke-bg" />
    </svg>
  );
}
