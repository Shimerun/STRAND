import { useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';
import { GLYPHS, GLYPH_SIZE } from './stencilGlyphs.js';
import { contourPath, cutLength, SAG, settled } from './stencilCut.js';

// Lettering of the stencil, in its view units: font size (the outlines in stencilGlyphs.js are made for it), word
// width, baseline.
export const TEXT = { size: GLYPH_SIZE, length: 960, baseline: 192 };
const GUIDE_DASH = '7 7';
// The cut-out letter falls like a sheet of paper: it drops `y` view units, slowed by the air (`drag` < 2 is less of
// an ease-in than a free fall), swinging `swings` times side to side by `sway`, tipping `tilt` deg into each
// swing and pitching (foreshortened by up to `pitch`) as it flutters; `settle`: share of the fall over which the
// swinging builds up.
const FALL = { y: 200, drag: 1.6, swings: 1.25, sway: 14, tilt: 10, pitch: 0.35, settle: 0.25 };
const STAGGER = 0.08; // share of the drop between one letter starting to fall and the next
const TAU = Math.PI * 2;
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

function CutLine({ flat, plan, g, cut, opacity }) {
  const { length } = plan.contours[g];
  const offset = useTransform(cut, (c) => length - cutLength(plan, g, c * plan.total));
  return (
    <motion.path
      d={contourPath(flat)}
      fill="none"
      strokeWidth="1.5"
      strokeDasharray={`${length} ${length}`}
      style={{ strokeDashoffset: offset, opacity }}
      className="stroke-text"
    />
  );
}

/**
 * One letter of the footer stencil (Stencil.jsx), cut along its outline as the shears pass (cut, 0..1 over the
 * whole word, timed by plan from stencilCut.js); once free it settles in its hole, then drops away like paper
 * (drop, 0..1), each letter a little after the one before.
 */
export default function StencilLetter({ char, box, letter, count, plan, cut, drop }) {
  const contours = GLYPHS[char];
  const outline = useMemo(() => contours.map(contourPath).join(''), [contours]);
  const side = letter % 2 ? 1 : -1;
  const fall = useTransform(drop, (d) => clamp01((d - letter * STAGGER) / (1 - STAGGER * (count - 1))));
  const swinging = (f) => Math.min(f / FALL.settle, 1);
  const y = useTransform([cut, fall], ([c, f]) => SAG * settled(plan, letter, c * plan.total) + FALL.y * f ** FALL.drag);
  const x = useTransform(fall, (f) => side * FALL.sway * Math.sin(f * TAU * FALL.swings) * swinging(f));
  // It tips into the way it swings: with the sway's speed, a quarter turn ahead of the sway itself.
  const rotate = useTransform(fall, (f) => side * FALL.tilt * Math.cos(f * TAU * FALL.swings) * swinging(f));
  const scaleY = useTransform(fall, (f) => 1 - FALL.pitch * Math.abs(Math.sin(f * Math.PI * FALL.swings)));
  const opacity = useTransform(fall, [0, 0.35, 1], [1, 1, 0]);
  const lineOpacity = useTransform(fall, [0, 0.1], [1, 0]);

  return (
    <g transform={`translate(${box.x} ${TEXT.baseline})`}>
      <motion.path
        d={outline}
        fillRule="evenodd"
        strokeWidth="2"
        style={{ x, y, rotate, scaleY, opacity, transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}
        className="fill-bg stroke-bg"
      />
      {/* "Cut here" outline, so the letters show on the black ground before the shears get to them. */}
      <motion.path d={outline} fill="none" strokeWidth="1" strokeDasharray={GUIDE_DASH} style={{ opacity: lineOpacity }} className="stroke-concrete" />
      {plan.contours.map(
        (contour, g) =>
          contour.letter === letter && (
            <CutLine key={g} flat={contours[contour.index]} plan={plan} g={g} cut={cut} opacity={lineOpacity} />
          ),
      )}
    </g>
  );
}
