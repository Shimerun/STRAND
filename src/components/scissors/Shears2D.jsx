import { useId } from 'react';

// Flat stand-in for the 3D model, drawn to read as the same polished steel: blades up, long axis vertical, halves
// hinged at the pivot. cx / cy: shape centre (the 3D pivot is the bounding-box centre too); length: tip to ring bottom.
const PIVOT = { x: 60, y: 160 };
export const SVG = { width: 120, height: 328, cx: 60, cy: 164, length: 318, pivot: `${PIVOT.x} ${PIVOT.y}` };

// Chrome: dark edges, a hard bright band and a softer second one, as the studio lights read on the model.
const STEEL = [['0', '#2f3338'], ['0.2', '#8d949b'], ['0.42', '#f4f6f8'], ['0.56', '#c4c9ce'], ['0.8', '#646a71'], ['1', '#25292d']];
const SCREW = [['0', '#ffffff'], ['0.45', '#b9bec3'], ['1', '#3b4045']];
const SHADOW = 'drop-shadow(0 10px 14px rgba(0, 0, 0, 0.55))';

// Each half: blade on one side of the axis, its bevel (the bright strip along the cutting edge), shank, ring centre
// and whether it carries the finger rest. The two blades meet on the axis, so closed they read as one blade.
const HALVES = {
  a: { blade: 'M60 4 C57 44 49 104 46 148 Q49 164 60 166 Z', bevel: 'M60 8 C58 46 54 104 53 150', shank: 'M60 160 C68 196 78 232 84 270', ring: 86, rest: true },
  b: { blade: 'M60 4 C63 44 71 104 74 148 Q71 164 60 166 Z', bevel: 'M60 8 C62 46 66 104 67 150', shank: 'M60 160 C52 196 42 232 36 270', ring: 34, rest: false },
};
const RING = { cy: 294, r: 21, stroke: 8 };

function Gradient({ id, stops, vertical = false }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
      {stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} stopColor={color} />
      ))}
    </linearGradient>
  );
}

function Half({ half, steel, steelV, halfRef }) {
  const { blade, bevel, shank, ring, rest } = HALVES[half];
  return (
    <g ref={halfRef}>
      <path d={shank} fill="none" stroke={`url(#${steelV})`} strokeWidth="9" strokeLinecap="round" />
      <circle cx={ring} cy={RING.cy} r={RING.r} fill="none" stroke={`url(#${steel})`} strokeWidth={RING.stroke} />
      {/* The ring's inner lip catches the light. */}
      <circle cx={ring} cy={RING.cy} r={RING.r - RING.stroke / 2 + 0.8} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
      {rest && <path d={`M${ring + 17} ${RING.cy + 12} q 16 8 20 26`} fill="none" stroke={`url(#${steel})`} strokeWidth="6" strokeLinecap="round" />}
      <path d={blade} fill={`url(#${steel})`} />
      <path d={bevel} fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

/** The SVG shears. svgRef, halfARef, halfBRef receive the elements the caller moves and opens. */
export default function Shears2D({ svgRef, halfARef, halfBRef }) {
  const id = useId().replace(/:/g, '');
  const steel = `${id}-steel`;
  const steelV = `${id}-steel-v`;
  const screw = `${id}-screw`;

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
        <Gradient id={steelV} stops={STEEL} vertical />
        <radialGradient id={screw} cx="0.35" cy="0.3" r="0.75">
          {SCREW.map(([offset, color]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </radialGradient>
      </defs>
      <Half half="b" steel={steel} steelV={steelV} halfRef={halfBRef} />
      <Half half="a" steel={steel} steelV={steelV} halfRef={halfARef} />
      {/* The pivot screw: domed steel with its slot. */}
      <circle cx={PIVOT.x} cy={PIVOT.y} r="7" fill={`url(#${screw})`} stroke="#25292d" strokeWidth="1" />
      <path d={`M${PIVOT.x - 4} ${PIVOT.y + 1.5} L${PIVOT.x + 4} ${PIVOT.y - 1.5}`} stroke="#3b4045" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
