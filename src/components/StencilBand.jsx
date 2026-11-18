import { useId, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { ease } from '../lib/heroCut.js';
import { fallAt } from './hero/paper.js';

export const VIEW = { width: 1000, height: 240 };
// The band of paper lying over the word, in view units; the shears cut along its top edge.
export const BAND = { top: 22, bottom: 218 };
// Cut loose, the band hangs from the cutting point in an arc (level at the cut, steeper towards its free end): by
// `SAG` of its width at that end once the cut is through, growing with the square of the cut, so it starts gently.
const SAG = 0.3;
// A snip every 1/count of the cut: the blades open (from `rest` to `open`) over the first `opening` of it while the
// tips run up to `lead` view units ahead of the cut, then shut onto it. Eased both ways and with `lead` small
// against the snip, so the tips never stop or turn back: that needs lead <= width * (1 - opening) / (count * 1.5),
// 44 here. Each snip leaves a `notch` (view units) in the cut edge.
const SNIP = { count: 6, rest: 0.1, open: 0.42, opening: 0.6, lead: 40, notch: 4 };
// The hanging part turns to the light: lighter by up to `LIFT` (white, opacity) at its free end.
const LIFT = 0.14;
// Its shadow on the word reaches `reach` of the sag above the cut edge, in `steps` layers of `opacity` each that
// pile up towards the edge (a blur would be redrawn on every frame of the cut).
const SHADOW = { reach: 0.3, steps: 7, opacity: 0.07 };
const SHADOW_STEPS = Array.from({ length: SHADOW.steps }, (_, i) => SHADOW.reach * ((i + 1) / SHADOW.steps) ** 1.6);
const SHADOW_GONE = 0.15; // share of the fall over which the shadow goes
// The slivers a snip sends off: where each flies to (px; back and clear of the blades, which cover the cut itself)
// and how far it turns (deg). A CSS animation (.stencil-chip in index.css): animated from JS, a dozen of them in
// the air doubled the frame time on a slow phone.
const CHIPS = [{ x: -30, y: -30, turn: -200 }, { x: -16, y: 52, turn: 160 }, { x: -54, y: 36, turn: -120 }];
const FADE = [0.55, 0.95]; // share of the fall over which the band goes, for screens it cannot fall off
const GUIDE_DASH = '7 7';
const n = (value) => +value.toFixed(1);
// An edge of the hanging part, from its free end to the cutting point (x) and back: level at the cut, `sag` lower
// at the free end.
const out = (x, y, sag) => `M0 ${n(y + sag)}Q${n(x / 2)} ${y} ${x} ${y}`;
const back = (x, y, sag) => `Q${n(x / 2)} ${y} 0 ${n(y + sag)}`;

/** The shears at cut share `c` (0..1): where the tips are along the band's top edge (view units) and the opening 0..1. */
export function shearsAt(c) {
  const phase = (c * SNIP.count) % 1;
  const t = phase < SNIP.opening ? ease(phase / SNIP.opening) : 1 - ease((phase - SNIP.opening) / (1 - SNIP.opening));
  return { x: c * VIEW.width + SNIP.lead * t, open: SNIP.rest + (SNIP.open - SNIP.rest) * t };
}

function Shadow({ at, reach }) {
  const d = useTransform(at, ({ x, sag }) => `${out(x, BAND.top, sag)}${back(x, BAND.top, sag * (1 - reach))}Z`);
  return <motion.path d={d} fillOpacity={SHADOW.opacity} />;
}

// Each time the blades shut (going forward), a few slivers of paper fly off the cutting point.
function Chips({ cut }) {
  const [snips, setSnips] = useState([]);
  const done = useRef(Math.floor(cut.get() * SNIP.count));
  const nextId = useRef(0);
  useMotionValueEvent(cut, 'change', (c) => {
    const now = Math.floor(c * SNIP.count);
    if (now > done.current) setSnips((list) => [...list, { id: ++nextId.current, x: (now / SNIP.count) * VIEW.width }]);
    done.current = now;
  });
  return snips.map(({ id, x }) =>
    CHIPS.map((chip, i) => (
      <span key={`${id}-${i}`} className="stencil-chip absolute h-[3px] w-[9px] bg-text"
        style={{ left: `${(x / VIEW.width) * 100}%`, top: `${(BAND.top / VIEW.height) * 100}%`, '--chip-x': `${chip.x}px`, '--chip-y': `${chip.y}px`, '--chip-turn': `${chip.turn}deg` }}
        onAnimationEnd={i ? undefined : () => setSnips((list) => list.filter((snip) => snip.id !== id))} />
    )),
  );
}

/**
 * The band over the footer word (Stencil.jsx), laid over its box: cut along its top edge from the left (cut, 0..1),
 * its freed part hanging from the cutting point and uncovering the word; cut through, it falls away like the
 * hero's strip of paper (drop, 0..1).
 */
export default function StencilBand({ cut, drop }) {
  const id = useId().replace(/:/g, '');
  // Where the cut has got to and how far the free end hangs.
  const at = useTransform(cut, (c) => ({ x: n(c * VIEW.width), sag: n(SAG * VIEW.width * c * c) }));
  const band = useTransform(at, ({ x, sag }) => `${out(x, BAND.top, sag)}H${VIEW.width}V${BAND.bottom}H${x}${back(x, BAND.bottom, sag)}Z`);
  const hanging = useTransform(at, ({ x, sag }) => `${out(x, BAND.top, sag)}V${BAND.bottom}${back(x, BAND.bottom, sag)}Z`);
  const cutEdge = useTransform(at, ({ x, sag }) => {
    let notches = '';
    for (let k = 1; k * VIEW.width <= x * SNIP.count; k++) {
      const [snip, share] = [(k * VIEW.width) / SNIP.count, 1 - (k * VIEW.width) / SNIP.count / x];
      notches += `M${n(snip)} ${n(BAND.top + sag * share * share)}v${SNIP.notch}`;
    }
    return out(x, BAND.top, sag) + notches;
  });
  // Drawn from the far end, so the dashes stand still while the cut eats the line.
  const guide = useTransform(at, ({ x }) => `M${VIEW.width} ${BAND.top}H${x}`);
  const shadow = useTransform(drop, [0, SHADOW_GONE], [1, 0]);
  // In screen units, so it falls off the screen whatever the size of the word.
  const fall = useTransform(drop, (f) => fallAt(f, 100, 100));
  const style = {
    x: useTransform(fall, (f) => `${f.x}vw`),
    y: useTransform(fall, (f) => `${f.y}svh`),
    rotate: useTransform(fall, (f) => f.rotate),
    rotateX: useTransform(fall, (f) => f.rotateX),
    rotateY: useTransform(fall, (f) => f.rotateY),
    transformPerspective: useTransform(fall, (f) => f.perspective),
    opacity: useTransform(drop, [0, ...FADE], [1, 1, 0]),
  };

  return (
    <motion.div style={style} className="absolute inset-0 will-change-transform">
      <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} className="block h-auto w-full overflow-visible text-text">
        <defs>
          <linearGradient id={`${id}-lift`} x1="1" x2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="1" stopColor="currentColor" stopOpacity={LIFT} />
          </linearGradient>
        </defs>
        <motion.g style={{ opacity: shadow }} className="fill-bg">
          {SHADOW_STEPS.map((reach) => (
            <Shadow key={reach} at={at} reach={reach} />
          ))}
        </motion.g>
        <motion.path d={band} strokeWidth="1" className="fill-surface stroke-line" />
        <motion.path d={hanging} fill={`url(#${id}-lift)`} style={{ opacity: cut }} />
        <motion.path d={guide} fill="none" strokeWidth="1" strokeDasharray={GUIDE_DASH} className="stroke-concrete" />
        <motion.path d={cutEdge} fill="none" strokeWidth="1.5" className="stroke-text" />
      </svg>
      <Chips cut={cut} />
    </motion.div>
  );
}
