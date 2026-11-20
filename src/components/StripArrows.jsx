import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { site } from '../data/site.js';
import ArrowIcon from './ArrowIcon.jsx';

const PAGE = 0.8; // share of the row's width one press scrolls; snapping then lines the items up
// aria-disabled, not disabled: a disabled button drops the keyboard focus onto the page as the row reaches its end.
const ARROW =
  'flex h-11 w-11 items-center justify-center rounded border border-edge transition-colors duration-150 hover:border-concrete aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:border-edge';

/**
 * Previous / next buttons for a sideways swipe row (`rowRef`, id `rowId`): they page through it for a mouse or a
 * keyboard, which have no swipe. Shown only while the row does not fit; each dims at its end.
 */
export default function StripArrows({ rowRef, rowId }) {
  const reduce = useReducedMotion();
  const [edges, setEdges] = useState({ start: true, end: true });
  const { prev, next } = site.ui.works;

  useEffect(() => {
    const row = rowRef.current;
    const update = () => {
      const start = row.scrollLeft <= 1;
      const end = row.scrollLeft + row.clientWidth >= row.scrollWidth - 1;
      setEdges((current) => (current.start === start && current.end === end ? current : { start, end }));
    };
    update();
    row.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(row);
    // "Show all" adds items without resizing the row itself.
    const added = new MutationObserver(update);
    added.observe(row, { childList: true });
    return () => {
      row.removeEventListener('scroll', update);
      observer.disconnect();
      added.disconnect();
    };
  }, [rowRef]);

  const page = (direction) => {
    if (direction < 0 ? edges.start : edges.end) return;
    const row = rowRef.current;
    row.scrollBy({ left: direction * row.clientWidth * PAGE, behavior: reduce ? 'auto' : 'smooth' });
  };

  if (edges.start && edges.end) return null;
  return (
    <div className="flex shrink-0 gap-2">
      <button type="button" aria-label={prev} aria-controls={rowId} aria-disabled={edges.start} onClick={() => page(-1)} className={ARROW}>
        <ArrowIcon className="rotate-180" />
      </button>
      <button type="button" aria-label={next} aria-controls={rowId} aria-disabled={edges.end} onClick={() => page(1)} className={ARROW}>
        <ArrowIcon />
      </button>
    </div>
  );
}
