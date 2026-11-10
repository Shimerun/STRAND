import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EASE_REVEAL } from '../../lib/motion.js';
import { TOP_ID } from '../../lib/scroll.js';
import { CUT_LINE } from './pose.js';
import { rig } from './rig.js';

const DRAW = 0.9; // s: the line runs from the shears to the left edge
const SOLID_AT = 0.8; // share of DRAW after which the solid line fades in
const FADE = 1.2; // s: then both lines fade out
const SECTION_THRESHOLD = 0.2;
// The hero and the section seen through it are cut by the hero cut (components/hero), not here.
const SECTIONS = `main section[id]:not(#${TOP_ID}):not([data-hero-underlay] section):not([data-scissors-end])`;
const END = '[data-scissors-end]';

let lastId = 0;

// One cut, anchored to the document so it stays where the page was cut.
function Cut({ cut, onDone }) {
  return (
    <div className="absolute left-0 top-0" style={{ width: cut.x, transform: `translateY(${cut.y}px)` }}>
      <motion.div
        className="cut-dashed relative h-px"
        style={{ originX: 1 }}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ scaleX: { duration: DRAW, ease: EASE_REVEAL }, opacity: { duration: FADE, delay: DRAW } }}
        onAnimationComplete={() => onDone(cut.id)}
      >
        <motion.div
          className="absolute inset-0 bg-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: DRAW * SOLID_AT, duration: DRAW * (1 - SOLID_AT) }}
        />
      </motion.div>
    </div>
  );
}

/**
 * Cut lines from the shears' tip as each section enters the view (once per section), and the final cut
 * across the top of [data-scissors-end] with a burst of snips. Not mounted under prefers-reduced-motion.
 */
export default function CutReveal() {
  const [cuts, setCuts] = useState([]);
  const remove = useCallback((id) => setCuts((list) => list.filter((cut) => cut.id !== id)), []);

  useEffect(() => {
    const addCut = (viewportY) => {
      const x = Math.min(rig.tipX, document.documentElement.clientWidth);
      setCuts((list) => [...list, { id: ++lastId, x, y: window.scrollY + viewportY }]);
    };

    const sections = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio < SECTION_THRESHOLD || !rig.visible) return;
          sections.unobserve(entry.target);
          addCut(rig.tipY);
        });
      },
      { threshold: SECTION_THRESHOLD },
    );
    document.querySelectorAll(SECTIONS).forEach((section) => sections.observe(section));

    // Fires each time the end element's top crosses CUT_LINE downwards; rigMotion fades the shears after it.
    let below = true;
    const end = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          below = entry.boundingClientRect.top > 0;
          return;
        }
        if (!below) return;
        below = false;
        if (!rig.visible) return;
        rig.burst();
        addCut(entry.boundingClientRect.top);
      },
      { rootMargin: `0px 0px -${Math.round((1 - CUT_LINE) * 100)}% 0px` },
    );
    const endElement = document.querySelector(END);
    if (endElement) end.observe(endElement);

    return () => {
      sections.disconnect();
      end.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[39] overflow-x-clip" aria-hidden="true">
      {cuts.map((cut) => (
        <Cut key={cut.id} cut={cut} onDone={remove} />
      ))}
    </div>
  );
}
