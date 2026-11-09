import { useId } from 'react';

// Geometry in viewBox units (48 × 120): a glass tube with a striped cylinder inside, between two chrome caps.
const VIEW = { width: 48, height: 120 };
const CX = VIEW.width / 2;
const GLASS = { x: CX - 14, y: 26, width: 28, height: 68 };
const CORE = { x: CX - 12, width: 24 }; // the striped cylinder, as tall as the glass
const CAP = { dome: 16, rim: 17 }; // half-widths of the chrome dome and the rim ring
const R = CORE.width / 2;

// Two black stripes wound round the cylinder. `period`: vertical repeat on the front (one stripe passing);
// turning the cylinder by one period moves every stripe up by exactly that much, so the loop is seamless.
// The loop in index.css moves the stripes by period / VIEW.height of the pole's height: keep the two in step.
const STRIPE = { period: 20, band: 9, count: 2 };
const RISE = (STRIPE.period * STRIPE.count) / (2 * Math.PI); // helix rise per radian of turn
const STEPS = 16; // points per stripe edge

// One stripe seen from the front: each edge is a helix projected on the cylinder, steep where it turns away.
const BAND = (() => {
  const edge = (offset) =>
    Array.from({ length: STEPS + 1 }, (_, i) => {
      const angle = -Math.PI / 2 + (Math.PI * i) / STEPS;
      return `${(CX + R * Math.sin(angle)).toFixed(2)},${(offset - RISE * angle).toFixed(2)}`;
    });
  return `M${[...edge(0), ...edge(STRIPE.band).reverse()].join('L')}Z`;
})();
const BAND_TOPS = Array.from(
  { length: Math.ceil(GLASS.height / STRIPE.period) + 4 },
  (_, i) => GLASS.y - 2 * STRIPE.period + i * STRIPE.period,
);

const CHROME = [[0, '#2a2d31'], [0.18, '#8d939a'], [0.34, '#f4f6f8'], [0.5, '#b9bec4'], [0.72, '#e4e7ea'], [1, '#24272b']];
const BALL = [[0, '#ffffff'], [0.35, '#d5d9dd'], [0.75, '#6f757c'], [1, '#2a2d31']];
// Across the cylinder: dark rims, a hot spot left of centre, a soft shadow to the right.
const SHADE = [[0, '#000', 0.7], [0.14, '#000', 0.25], [0.3, '#fff', 0], [0.38, '#fff', 0.38], [0.48, '#fff', 0.04], [0.78, '#000', 0.22], [1, '#000', 0.75]];
// The glass: bright thin edges, clear in the middle.
const GLASS_SHADE = [[0, '#fff', 0.4], [0.07, '#fff', 0.06], [0.5, '#fff', 0.02], [0.93, '#fff', 0.06], [1, '#fff', 0.35]];

const stops = (list) =>
  list.map(([offset, color, opacity = 1]) => <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />);

// Dome, rim and finial ball; `flip` mirrors it for the bottom cap.
function Cap({ flip, chrome, ball }) {
  const at = (y) => (flip ? VIEW.height - y : y);
  const [left, right] = [CX - CAP.dome, CX + CAP.dome];
  const dome = `M${left} ${at(22)} C${left} ${at(15)} ${CX - 8} ${at(12)} ${CX} ${at(12)} C${CX + 8} ${at(12)} ${right} ${at(15)} ${right} ${at(22)} Z`;
  return (
    <g>
      <rect x={CX - 2} y={flip ? at(13) : 7} width="4" height="6" fill={`url(#${chrome})`} />
      <circle cx={CX} cy={at(6)} r="4.5" fill={`url(#${ball})`} />
      <path d={dome} fill={`url(#${chrome})`} />
      <rect x={CX - CAP.rim} y={flip ? at(26) : 22} width={CAP.rim * 2} height="4" rx="1" fill={`url(#${chrome})`} stroke="#000" strokeOpacity="0.45" strokeWidth="0.5" />
    </g>
  );
}

const VIEW_BOX = `0 0 ${VIEW.width} ${VIEW.height}`;
const LAYER = 'absolute inset-0 h-full w-full';
const share = (value, of) => `${((value / of) * 100).toFixed(3)}%`;
// The cylinder's window as a CSS clip of a pole-sized box: top, right, bottom, left.
const CORE_CLIP = `inset(${share(GLASS.y, VIEW.height)} ${share(VIEW.width - CORE.x - CORE.width, VIEW.width)} ${share(VIEW.height - GLASS.y - GLASS.height, VIEW.height)} ${share(CORE.x, VIEW.width)})`;

/**
 * Black-and-white barber pole whose cylinder turns on a CSS loop (.barber-pole-stripes in index.css; still
 * under reduced motion). Three stacked drawings: the back, the stripes, and the shading, glass and caps over
 * them. The stripes are a layer of their own so the loop runs on the compositor: turning the pole costs the
 * page no style, layout or paint work, however long it spins.
 * period: seconds for one stripe to pass. stripesRef: the turning element, for callers that change its speed
 * (element.getAnimations()).
 */
export default function BarberPole({ height = 72, period = 1.1, stripesRef, className = '' }) {
  const id = useId().replace(/:/g, '');
  const ref = (name) => `${id}-${name}`;
  const { x, y, width, height: tube } = GLASS;

  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: (height * VIEW.width) / VIEW.height, height }}
    >
      <svg viewBox={VIEW_BOX} className={LAYER}>
        {/* Through the glass, a dark gap on either side of the cylinder. */}
        <rect x={x} y={y} width={width} height={tube} fill="#000" fillOpacity="0.55" />
        <rect x={CORE.x} y={y} width={CORE.width} height={tube} className="fill-text" />
      </svg>

      <span className={LAYER} style={{ clipPath: CORE_CLIP }}>
        <svg ref={stripesRef} viewBox={VIEW_BOX} className={`barber-pole-stripes overflow-visible ${LAYER}`} style={{ animationDuration: `${period}s` }}>
          {BAND_TOPS.map((top) => (
            <path key={top} d={BAND} transform={`translate(0 ${top})`} className="fill-bg" />
          ))}
        </svg>
      </span>

      <svg viewBox={VIEW_BOX} className={LAYER}>
        <defs>
          <linearGradient id={ref('chrome')} x1="0" x2="1">{stops(CHROME)}</linearGradient>
          <radialGradient id={ref('ball')} cx="0.38" cy="0.32" r="0.7">{stops(BALL)}</radialGradient>
          <linearGradient id={ref('shade')} x1="0" x2="1">{stops(SHADE)}</linearGradient>
          <linearGradient id={ref('glass')} x1="0" x2="1">{stops(GLASS_SHADE)}</linearGradient>
        </defs>
        <rect x={CORE.x} y={y} width={CORE.width} height={tube} fill={`url(#${ref('shade')})`} />
        <rect x={x} y={y} width={width} height={tube} fill={`url(#${ref('glass')})`} />
        <rect x={x + 3.5} y={y} width="1.4" height={tube} fill="#fff" fillOpacity="0.75" />
        <rect x={x + width - 4} y={y} width="0.7" height={tube} fill="#fff" fillOpacity="0.3" />

        <Cap chrome={ref('chrome')} ball={ref('ball')} />
        <Cap flip chrome={ref('chrome')} ball={ref('ball')} />
      </svg>
    </span>
  );
}
