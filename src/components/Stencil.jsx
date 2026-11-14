import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { site } from '../data/site.js';
import { setScene } from './scissors/rig.js';
import StencilLetter, { TEXT } from './StencilLetter.jsx';
import { GLYPHS } from './stencilGlyphs.js';
import { buildCutPlan, cutState } from './stencilCut.js';

const WORD = site.name.toUpperCase();
const VIEW = { width: 1000, height: 240 };
const FADE = 0.04; // share of the cut over which the borrowed shears come and go
// A hand turns the paper, not the shears: they keep pointing right and only lean up to TURN (rad) with a cut that
// runs up or down, rather than spinning round every outline.
const TURN = Math.PI / 6;
// The pinned stage in screen heights: its height, and the extra scroll it is held for while the word is cut.
// Phones get a lower stage and a shorter pin: the word is small there, and a full screen held over two screens
// of scrolling was mostly black. The lower stage also lets the footer rise under the scene as it ends. step: view
// units per bite, about one blade of the borrowed shears; ~60 bites get ~17 px of scroll each (desktop), ~9 (phone).
const STAGE = { full: { height: 1, pin: 2, step: 100 }, compact: { height: 0.7, pin: 1, step: 150 } };
const COMPACT = '(max-width: 767px)';
const CUT_RANGE = [0.05, 0.65]; // share of the pin: the letters get cut
const DROP_RANGE = [0.65, 0.95]; // share of the pin: the cut-out letters drop away
const CLOSING_RANGE = [0.4, 1]; // share of the drop: what stands under the word comes in
const WHITE_INSET = 4; // view units; the letters sit well inside
const WORD_PROPS = {
  x: (VIEW.width - TEXT.length) / 2,
  y: TEXT.baseline,
  fontSize: TEXT.size,
  fontWeight: 800,
  textLength: TEXT.length,
  lengthAdjust: 'spacing',
};
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

/**
 * Footer finale: the site's shears (borrowed from the rig, a little smaller) cut the letters of the name out of
 * the black ground one by one, snip by snip along their outlines; the cut-out letters drop away and leave white
 * holes.
 * children: what stands under the word once it is cut (the closing call to action); it rises in as the letters
 * drop and cannot be reached or read before that. Reduced motion: shown already cut, the children with it.
 */
export default function Stencil({ children }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const trackRef = useRef(null);
  const rootRef = useRef(null);
  const wordRef = useRef(null);
  const [layout, setLayout] = useState(null); // { boxes, plan } once the font is in
  const [stage] = useState(() => (window.matchMedia(COMPACT).matches ? STAGE.compact : STAGE.full));
  // Progress over the pin: from the stage reaching the top of the screen to its release.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', `end ${stage.height}`] });
  const cut = useTransform(scrollYProgress, CUT_RANGE, [0, 1]);
  const drop = useTransform(scrollYProgress, DROP_RANGE, [0, 1]);
  const closing = useTransform(drop, CLOSING_RANGE, [0, 1]);
  const closingY = useTransform(closing, [0, 1], [24, 0]);
  const closingVisibility = useTransform(closing, (c) => (c > 0 ? 'visible' : 'hidden'));

  // While the letters are being cut, the shears follow the outline being cut, snipping. Everything is read fresh
  // (progress from the event, the plan from a ref): `cut` only catches up on the next frame and a stale value, or a
  // plan made after the last scroll, would leave the shears away for good.
  const planRef = useRef(null);
  const publish = useCallback(
    (progress) => {
      const c = clamp01((progress - CUT_RANGE[0]) / (CUT_RANGE[1] - CUT_RANGE[0]));
      const plan = planRef.current;
      if (reduce || !plan || c <= 0 || c >= 1) {
        setScene(null);
        return;
      }
      const { at, dir, open } = cutState(plan, c * plan.total);
      const angle = TURN * dir.y;
      // The blades cross at the end of the cut: shut, the tips are on it; open, they reach one bite past it.
      const reach = stage.step * open;
      const rect = rootRef.current.getBoundingClientRect();
      const scale = rect.width / VIEW.width;
      setScene({
        weight: Math.min(c / FADE, (1 - c) / FADE, 1),
        tipX: rect.left + (at.x + Math.cos(angle) * reach) * scale,
        tipY: rect.top + (at.y + Math.sin(angle) * reach) * scale,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        open,
      });
    },
    [reduce, stage.step],
  );
  useMotionValueEvent(scrollYProgress, 'change', publish);

  useEffect(() => {
    let alive = true;
    // Letter boxes come from the rendered word once the font is in, so the cut-outs sit exactly on the holes.
    document.fonts.ready.then(() => {
      const word = wordRef.current;
      if (!alive || !word) return;
      const boxes = [...WORD].map((_, i) => ({ x: word.getStartPositionOfChar(i).x }));
      const plan = buildCutPlan(WORD, boxes, TEXT.baseline, stage.step);
      planRef.current = plan;
      setLayout({ boxes, plan });
      publish(scrollYProgress.get()); // the page may already be scrolled into the cut
    });
    return () => {
      alive = false;
      setScene(null);
    };
  }, [publish, scrollYProgress, stage.step]);

  return (
    <div ref={trackRef} className="relative" style={reduce ? undefined : { height: `${(stage.height + stage.pin) * 100}svh` }}>
      <div className={reduce ? 'py-6' : 'sticky top-0 flex items-center'} style={reduce ? undefined : { height: `${stage.height * 100}svh` }}>
        <div className="mx-auto w-full max-w-6xl pl-5 pr-[var(--gutter)]">
          <div ref={rootRef} aria-hidden="true" className="relative">
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
                layout &&
                [...WORD].map(
                  (char, i) =>
                    GLYPHS[char] && (
                      <StencilLetter key={`${char}-${i}`} char={char} box={layout.boxes[i]} letter={i} count={WORD.length}
                        plan={layout.plan} cut={cut} drop={drop} />
                    ),
                )}
            </svg>
          </div>
          {children && (
            <motion.div style={reduce ? undefined : { opacity: closing, y: closingY, visibility: closingVisibility }} className="mt-10 md:mt-14">
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
