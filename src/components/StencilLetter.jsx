import { motion, useTransform } from 'framer-motion';

// Lettering of the stencil, in its view units: font size, word width, baseline, cap height.
export const TEXT = { size: 205, length: 960, baseline: 192, cap: 150 };
const OUTLINE = 1200; // dash length long enough for any letter outline
const GUIDE_DASH = '7 7';
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

/**
 * One letter of the footer stencil (Stencil.jsx): its outline is drawn as the shears pass (cut, 0..1 over the
 * whole word), then the cut-out piece drops away (drop, 0..1), each letter a little after the one before.
 */
export default function StencilLetter({ char, box, index, count, cut, drop }) {
  const dashOffset = useTransform(cut, (c) => OUTLINE * (1 - clamp01(c * count - index)));
  const fall = useTransform(drop, (d) => clamp01((d - index * 0.08) / (1 - 0.08 * (count - 1))));
  const y = useTransform(fall, (f) => f * 180);
  const rotate = useTransform(fall, (f) => f * (index % 2 ? 9 : -9));
  const opacity = useTransform(fall, [0, 0.2, 1], [1, 1, 0]);
  const lineOpacity = useTransform(fall, [0, 0.1], [1, 0]);
  const props = { x: box.x, y: TEXT.baseline, fontSize: TEXT.size, fontWeight: 800 };

  return (
    <>
      <motion.text {...props} style={{ y, rotate, opacity }} strokeWidth="2" className="fill-bg stroke-bg">
        {char}
      </motion.text>
      {/* "Cut here" outline, so the letters show on the black ground before the shears get to them. */}
      <motion.text {...props} fill="none" strokeWidth="1" strokeDasharray={GUIDE_DASH} style={{ opacity: lineOpacity }} className="stroke-concrete">
        {char}
      </motion.text>
      <motion.text {...props} fill="none" strokeWidth="1.5" strokeDasharray={OUTLINE} style={{ strokeDashoffset: dashOffset, opacity: lineOpacity }} className="stroke-text">
        {char}
      </motion.text>
    </>
  );
}
