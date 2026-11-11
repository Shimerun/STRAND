import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import ArrowIcon from '../ArrowIcon.jsx';
import Img from '../Img.jsx';

const ROW_ID = 'profile-works';
const PAGE = 0.8; // share of the row's width one arrow press scrolls; snapping then lines the cards up
const ARROW =
  'flex h-11 w-11 items-center justify-center rounded border border-edge transition-colors duration-300 hover:border-concrete disabled:cursor-default disabled:opacity-30 disabled:hover:border-edge';

/**
 * A barber's works as a swipe row. The arrows page through it for a mouse, which has no sideways wheel; they
 * show only when the row does not fit and dim at either end. `heading` sits on the arrows' line.
 */
export default function ProfileWorks({ works, heading }) {
  const reduce = useReducedMotion();
  const rowRef = useRef(null);
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
    return () => {
      row.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  const page = (direction) => {
    const row = rowRef.current;
    row.scrollBy({ left: direction * row.clientWidth * PAGE, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        {heading}
        {!(edges.start && edges.end) && (
          <div className="flex gap-2">
            <button type="button" aria-label={prev} aria-controls={ROW_ID} disabled={edges.start} onClick={() => page(-1)} className={ARROW}>
              <ArrowIcon className="rotate-180" />
            </button>
            <button type="button" aria-label={next} aria-controls={ROW_ID} disabled={edges.end} onClick={() => page(1)} className={ARROW}>
              <ArrowIcon />
            </button>
          </div>
        )}
      </div>
      <ul
        ref={rowRef}
        id={ROW_ID}
        className="-mx-5 mt-4 flex snap-x scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {works.map((work) => (
          <li key={work.src} className="w-36 shrink-0 snap-start overflow-hidden rounded bg-surface sm:w-44">
            <Img src={assetUrl(work.src)} alt={work.alt} width={work.width} height={work.height} className="aspect-[4/5] h-auto w-full object-cover" />
          </li>
        ))}
      </ul>
    </>
  );
}
