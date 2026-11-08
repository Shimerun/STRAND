import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { site } from '../data/site.js';
import { setScene } from './scissors/rig.js';

const WORD = site.name.toUpperCase();
const VIEW = { width: 1000, height: 240 };
const TEXT = { size: 205, length: 960, baseline: 192, cap: 150 }; // font size, word width, baseline, cap height
const OUTLINE = 1200; // dash length long enough for any letter outline
const SNIPS_PER_LETTER = 3;
const FADE = 0.04; // share of the cut over which the borrowed shears come and go
const PIN = 1.2; // extra scroll, in screen heights, while the stencil stays centred and gets cut
const CUT_RANGE = [0.05, 0.65]; // share of the pin: the letters get cut
const DROP_RANGE = [0.65, 0.95]; // share of the pin: the cut-out letters drop away
const WHITE_INSET = 4; // view units; the letters sit well inside
const GUIDE_DASH = '7 7';
const WORD_PROPS = {
  x: (VIEW.width - TEXT.length) / 2,
  y: TEXT.baseline,
  fontSize: TEXT.size,
  fontWeight: 800,
  textLength: TEXT.length,
  lengthAdjust: 'spacing',
};
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

function Letter({ char, box, index, count, cut, drop }) {
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

/**
 * Footer finale: the site's shears (borrowed from the rig, a little smaller) cut the letters of the name out of
 * the black ground one by one along their tops; the cut-out letters drop away and leave white holes.
 * Reduced motion: shown already cut.
 */
export default function Stencil() {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const trackRef = useRef(null);
  const rootRef = useRef(null);
  const wordRef = useRef(null);
  const [boxes, setBoxes] = useState(null);
  // Progress over the pin: from the stencil settling in the middle of the screen to the end of its scroll room.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const cut = useTransform(scrollYProgress, CUT_RANGE, [0, 1]);
  const drop = useTransform(scrollYProgress, DROP_RANGE, [0, 1]);

  // While the letters are being cut, the shears ride along the top of the current one, snipping. Everything is
  // read fresh (progress from the event, letter boxes from a ref): `cut` only catches up on the next frame and a
  // stale value, or boxes measured after the last scroll, would leave the shears away for good.
  const boxesRef = useRef(null);
  const publish = useCallback(
    (progress) => {
      const c = clamp01((progress - CUT_RANGE[0]) / (CUT_RANGE[1] - CUT_RANGE[0]));
      const measured = boxesRef.current;
      if (reduce || !measured || c <= 0 || c >= 1) {
        setScene(null);
        return;
      }
      const slot = Math.min(Math.floor(c * WORD.length), WORD.length - 1);
      const local = c * WORD.length - slot;
      const box = measured[slot];
      const rect = rootRef.current.getBoundingClientRect();
      const scale = rect.width / VIEW.width;
      setScene({
        weight: Math.min(c / FADE, (1 - c) / FADE, 1),
        tipX: rect.left + (box.x + local * box.width) * scale,
        tipY: rect.top + (TEXT.baseline - TEXT.cap) * scale,
        dirX: 1,
        dirY: 0,
        open: 0.5 + 0.5 * Math.cos(2 * Math.PI * local * SNIPS_PER_LETTER),
      });
    },
    [reduce],
  );
  useMotionValueEvent(scrollYProgress, 'change', publish);

  useEffect(() => {
    let alive = true;
    // Letter boxes come from the rendered word once the font is in, so the cut-outs sit exactly on the holes.
    document.fonts.ready.then(() => {
      const word = wordRef.current;
      if (!alive || !word) return;
      const measured = [...WORD].map((_, i) => ({ x: word.getStartPositionOfChar(i).x, width: word.getExtentOfChar(i).width }));
      boxesRef.current = measured;
      setBoxes(measured);
      publish(scrollYProgress.get()); // the page may already be scrolled into the cut
    });
    return () => {
      alive = false;
      setScene(null);
    };
  }, [publish, scrollYProgress]);

  return (
    <div ref={trackRef} aria-hidden="true" className="relative" style={reduce ? undefined : { height: `${(1 + PIN) * 100}svh` }}>
      <div className={reduce ? 'py-6' : 'sticky top-0 flex h-svh items-center'}>
        <div className="mx-auto w-full max-w-6xl pl-5 pr-[var(--gutter)]">
          <div ref={rootRef} className="relative">
            <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} className="block h-auto w-full overflow-visible">
              <defs>
                <mask id={`${id}-holes`}>
                  <rect width={VIEW.width} height={VIEW.height} fill="#fff" />
                  <text {...WORD_PROPS} fill="#000">
                    {WORD}
                  </text>
                </mask>
              </defs>
              {/* Text inside a mask is never laid out, so the letters are measured on this invisible copy. */}
              <text ref={wordRef} {...WORD_PROPS} visibility="hidden">
                {WORD}
              </text>
              {/* Inset, so its edges stay under the black ground instead of showing as a hairline frame. */}
              <rect x={WHITE_INSET} y={WHITE_INSET} width={VIEW.width - 2 * WHITE_INSET} height={VIEW.height - 2 * WHITE_INSET} className="fill-text" />
              <rect width={VIEW.width} height={VIEW.height} mask={`url(#${id}-holes)`} className="fill-bg" />
              {!reduce &&
                boxes &&
                [...WORD].map((char, i) => (
                  <Letter key={`${char}-${i}`} char={char} box={boxes[i]} index={i} count={WORD.length} cut={cut} drop={drop} />
                ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
