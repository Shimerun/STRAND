import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { EASE_REVEAL } from '../../lib/motion.js';
import { lockScroll, unlockScroll } from '../../lib/scroll.js';
import Img from '../Img.jsx';

const FOCUSABLE = 'a[href], button:not([disabled])';
const SWIPE_OFFSET = 80;
const SWIPE_VELOCITY = 500;
const transition = { duration: 0.3, ease: EASE_REVEAL };
const NAV_BUTTON =
  'absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded bg-bg/60 transition-colors duration-300 hover:bg-bg';

function Chevron({ flip = false }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={flip ? 'rotate-180' : ''}>
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function Lightbox({ works, index, onIndexChange, onClose }) {
  const rootRef = useRef(null);
  const closeRef = useRef(null);
  // Captured at first render: under StrictMode the effect re-runs after focus has already moved.
  const [opener] = useState(() => document.activeElement);
  const { cta, sections, works: labels } = site.ui;
  const work = works[index];
  const many = works.length > 1;

  useEffect(() => {
    lockScroll();
    closeRef.current?.focus();
    return () => {
      unlockScroll();
      opener?.focus?.({ preventScroll: true });
    };
  }, [opener]);

  const step = (delta) => onIndexChange((index + delta + works.length) % works.length);

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (many && event.key === 'ArrowRight') {
      step(1);
    } else if (many && event.key === 'ArrowLeft') {
      step(-1);
    } else if (event.key === 'Tab') {
      const focusable = rootRef.current.querySelectorAll(FOCUSABLE);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const onDragEnd = (_, { offset, velocity }) => {
    if (offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY) step(1);
    else if (offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY) step(-1);
  };

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={sections.works}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[60] flex flex-col bg-bg/95 outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      <div className="flex h-header shrink-0 items-center justify-between px-5">
        <p aria-live="polite" className="text-xs font-medium tracking-heading text-concrete">
          {many && `${index + 1} / ${works.length}`}
        </p>
        <button
          ref={closeRef}
          type="button"
          aria-label={cta.close}
          onClick={onClose}
          className="-mr-3 flex h-12 w-12 items-center justify-center rounded"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] lg:px-24">
        <motion.div
          drag={many ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={onDragEnd}
          className="flex h-full w-full items-center justify-center"
        >
          <motion.div key={work.src} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition} className="w-full">
            <Img
              src={assetUrl(work.src)}
              alt={work.alt}
              width={work.width ?? 1200}
              height={work.height ?? 1500}
              priority
              draggable={false}
              className="mx-auto h-auto max-h-[calc(100svh-9rem)] w-full select-none object-contain"
            />
          </motion.div>
        </motion.div>

        {many && (
          <>
            <button type="button" aria-label={labels.prev} onClick={() => step(-1)} className={`${NAV_BUTTON} left-2 lg:left-6`}>
              <Chevron />
            </button>
            <button type="button" aria-label={labels.next} onClick={() => step(1)} className={`${NAV_BUTTON} right-2 lg:right-6`}>
              <Chevron flip />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
