import { useId } from 'react';

// Geometry in viewBox units (36 × 100): glass tube between two chrome caps.
const GLASS = { x: 9, y: 19, width: 18, height: 62 };
const STRIPE = { period: 14, band: 7, slant: 11 }; // vertical repeat, band thickness, rise across the tube
const BANDS = Array.from({ length: Math.ceil(GLASS.height / STRIPE.period) + 3 }, (_, i) => GLASS.y - STRIPE.period + i * STRIPE.period);
const CHROME = [['0', '#2f3338'], ['0.3', '#eef0f2'], ['0.55', '#9aa0a7'], ['0.8', '#e2e5e8'], ['1', '#2a2d31']];
// Across the tube: dark rims, a soft highlight left of centre, shadow on the right, as on a lit cylinder.
const SHADE = [['0', '#000', 0.6], ['0.18', '#000', 0.1], ['0.32', '#fff', 0.35], ['0.45', '#fff', 0], ['0.8', '#000', 0.25], ['1', '#000', 0.7]];

function Cap({ y, flip, chrome }) {
  const ball = flip ? y + 11 : y - 3;
  return (
    <g>
      <circle cx="18" cy={ball} r="3.5" fill={`url(#${chrome})`} />
      <rect x="6" y={flip ? y : y + 1} width="24" height="6" rx="2" fill={`url(#${chrome})`} />
      <rect x="8" y={flip ? y - 1 : y + 6} width="20" height="2" fill={`url(#${chrome})`} opacity="0.8" />
    </g>
  );
}

/** Black-and-white barber pole whose stripes spiral up; a loading indicator. Still under reduced motion (CSS). */
export default function BarberPole({ height = 72, className = '' }) {
  const id = useId().replace(/:/g, '');
  const chrome = `${id}-chrome`;
  const shade = `${id}-shade`;
  const glass = `${id}-glass`;
  const { x, y, width, height: tube } = GLASS;

  return (
    <svg width={(height * 36) / 100} height={height} viewBox="0 0 36 100" aria-hidden="true" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={chrome} x1="0" x2="1">
          {CHROME.map(([offset, color]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </linearGradient>
        <linearGradient id={shade} x1="0" x2="1">
          {SHADE.map(([offset, color, opacity]) => (
            <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </linearGradient>
        <clipPath id={glass}>
          <rect x={x} y={y} width={width} height={tube} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${glass})`}>
        <rect x={x} y={y} width={width} height={tube} className="fill-text" />
        <g className="barber-pole-stripes">
          {BANDS.map((top) => (
            <polygon
              key={top}
              points={`${x},${top + STRIPE.slant} ${x + width},${top} ${x + width},${top + STRIPE.band} ${x},${top + STRIPE.slant + STRIPE.band}`}
              className="fill-bg"
            />
          ))}
        </g>
        <rect x={x} y={y} width={width} height={tube} fill={`url(#${shade})`} />
        <rect x={x + 4} y={y} width="1.5" height={tube} fill="#fff" opacity="0.55" />
      </g>
      <rect x={x} y={y} width={width} height={tube} fill="none" stroke="#000" strokeOpacity="0.6" strokeWidth="0.75" />

      <Cap y={13} chrome={chrome} />
      <Cap y={81} flip chrome={chrome} />
    </svg>
  );
}
