import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { site } from '../data/site.js';
import { EASE_REVEAL } from '../lib/motion.js';
import { BOOKING_ID, lockScroll, scrollToId, unlockScroll } from '../lib/scroll.js';
import { EVENTS, track } from '../lib/track.js';
import Button from './Button.jsx';
import Logo from './Logo.jsx';

const DESKTOP_QUERY = '(min-width: 1024px)';
const FOCUSABLE = 'a[href], button:not([disabled])';

const list = { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_REVEAL } },
};
const itemFade = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };

export default function MobileMenu({ id, onClose }) {
  const rootRef = useRef(null);
  const closeRef = useRef(null);
  const reduce = useReducedMotion();
  const { nav, cta } = site.ui;

  useEffect(() => {
    lockScroll();
    closeRef.current?.focus();
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event) => event.matches && onClose();
    desktop.addEventListener('change', onChange);
    return () => {
      desktop.removeEventListener('change', onChange);
      unlockScroll();
    };
  }, [onClose]);

  // Scroll must be unlocked before scrolling: a stopped Lenis ignores scrollTo.
  const go = (target) => (event) => {
    event.preventDefault();
    unlockScroll();
    scrollToId(target);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = rootRef.current.querySelectorAll(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <motion.div
      ref={rootRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label={cta.menu}
      data-lenis-prevent
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 overflow-y-auto bg-bg lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE_REVEAL }}
    >
      <div className="flex min-h-full flex-col">
        <div className="flex h-header shrink-0 items-center justify-between px-5">
          <Logo />
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

        <nav aria-label={cta.menu} className="flex flex-1 flex-col justify-center px-5 py-8">
          <motion.ul variants={list} initial="hidden" animate="visible">
            {nav.map(({ id: target, label }) => (
              <motion.li key={target} variants={reduce ? itemFade : item}>
                <a
                  href={`#${target}`}
                  onClick={go(target)}
                  className="block py-2 text-3xl font-extrabold uppercase tracking-heading transition-colors duration-300 hover:text-concrete"
                >
                  {label}
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </nav>

        <div className="shrink-0 space-y-5 px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <Button className="w-full" track={{ name: EVENTS.bookClick, where: 'menu' }} onClick={go(BOOKING_ID)}>
            {cta.book}
          </Button>
          <a
            href={`tel:${site.phone}`}
            onClick={() => track(EVENTS.callClick, { where: 'menu' })}
            className="block text-center text-sm font-medium tracking-heading text-concrete transition-colors duration-300 hover:text-text"
          >
            {site.phoneDisplay}
          </a>
        </div>
      </div>
    </motion.div>
  );
}
