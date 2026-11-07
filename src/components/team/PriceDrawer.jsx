import { useEffect, useId, useRef, useState } from 'react';
import { motion, useDragControls, useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { formatDuration, formatPrice } from '../../lib/format.js';
import { EASE_REVEAL } from '../../lib/motion.js';
import { priceFor, servicesFor } from '../../lib/pricing.js';
import { lockScroll, unlockScroll } from '../../lib/scroll.js';
import { EVENTS } from '../../lib/track.js';
import { useMediaQuery } from '../../lib/useMediaQuery.js';
import Button from '../Button.jsx';

const DESKTOP_QUERY = '(min-width: 1024px)';
const FOCUSABLE = 'a[href], button:not([disabled])';
const SWIPE_CLOSE_OFFSET = 120;
const SWIPE_CLOSE_VELOCITY = 500;
const transition = { duration: 0.4, ease: EASE_REVEAL };

const PANEL = {
  sheet: { hidden: { y: '100%' }, visible: { y: 0 } },
  side: { hidden: { x: '100%' }, visible: { x: 0 } },
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

export default function PriceDrawer({ barber, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  // Captured at first render: under StrictMode the effect re-runs after focus has already moved.
  const [opener] = useState(() => document.activeElement);
  const titleId = useId();
  const reduce = useReducedMotion();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const dragControls = useDragControls();
  const { openBooking } = useBooking();
  const { cta, team } = site.ui;
  const swipe = !desktop;

  useEffect(() => {
    lockScroll();
    closeRef.current?.focus();
    return () => {
      unlockScroll();
      opener?.focus?.({ preventScroll: true });
    };
  }, [opener]);

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = panelRef.current.querySelectorAll(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onDragEnd = (_, info) => {
    if (info.offset.y > SWIPE_CLOSE_OFFSET || info.velocity.y > SWIPE_CLOSE_VELOCITY) onClose();
  };

  // Scroll must be unlocked before scrolling: a stopped Lenis ignores scrollTo.
  const book = () => {
    unlockScroll();
    onClose();
    openBooking({ barber: barber.slug });
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-bg/80"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        variants={reduce ? PANEL.fade : desktop ? PANEL.side : PANEL.sheet}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={transition}
        drag={swipe ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={onDragEnd}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t border-t border-line bg-surface outline-none lg:inset-y-0 lg:left-auto lg:max-h-none lg:w-[28rem] lg:rounded-none lg:border-l lg:border-t-0"
      >
        <div
          onPointerDown={swipe ? (event) => dragControls.start(event) : undefined}
          className="shrink-0 touch-none px-5 pb-4 pt-3 lg:touch-auto lg:px-8 lg:pt-8"
        >
          <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-line lg:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-heading text-concrete">{team.prices}</p>
              <h2 id={titleId} className="mt-1 text-xl">
                {barber.name}
              </h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              aria-label={cta.close}
              onClick={onClose}
              className="-mr-3 -mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>

        <ul data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain border-t border-line px-5 lg:px-8">
          {servicesFor(barber.slug).map((service) => (
            <li key={service.id} className="flex items-start justify-between gap-4 border-b border-line py-4 last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm font-bold">{service.name}</p>
                <p className="mt-1 text-xs text-concrete">{formatDuration(service.durationMin)}</p>
                {service.note && <p className="mt-1 text-xs text-concrete">{service.note}</p>}
              </div>
              <p className="shrink-0 text-sm font-bold">
                {formatPrice(priceFor(service.id, barber.slug), { from: service.from === true })}
              </p>
            </li>
          ))}
        </ul>

        <div className="shrink-0 border-t border-line px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 lg:px-8 lg:pb-8">
          <Button className="w-full" track={{ name: EVENTS.bookClick, where: 'drawer', barber: barber.slug }} onClick={book}>
            {cta.bookWithBarber}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
