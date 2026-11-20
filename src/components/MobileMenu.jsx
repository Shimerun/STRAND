import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { site } from '../data/site.js';
import { EASE_REVEAL } from '../lib/motion.js';
import { bookingEnabled } from '../lib/booking.js';
import { BOOKING_ID, scrollToId, unlockScroll } from '../lib/scroll.js';
import { useDialog } from '../lib/useDialog.js';
import BookButton from './BookButton.jsx';
import CloseButton from './CloseButton.jsx';
import Logo from './Logo.jsx';
import PhoneLink from './PhoneLink.jsx';
import SpinningPole from './SpinningPole.jsx';

const DESKTOP_QUERY = '(min-width: 1024px)';

const list = { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_REVEAL } },
};
const itemFade = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };

export default function MobileMenu({ id, onClose }) {
  const rootRef = useRef(null);
  const closeRef = useRef(null);
  // Header restores focus to the menu toggle itself.
  const onKeyDown = useDialog(rootRef, closeRef, onClose, { restoreFocus: false });
  const reduce = useReducedMotion();
  const { nav, cta } = site.ui;

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event) => event.matches && onClose();
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, [onClose]);

  // Scroll must be unlocked before scrolling: a stopped Lenis ignores scrollTo. Closing first, because it hands
  // focus back to the menu button and scrollToId then moves it on to the section.
  const go = (target) => (event) => {
    event.preventDefault();
    onClose();
    unlockScroll();
    scrollToId(target);
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
          <span className="flex items-center gap-3">
            <SpinningPole />
            <Logo />
          </span>
          <CloseButton ref={closeRef} onClick={onClose} />
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
          <BookButton className="w-full" track={{ where: 'menu' }} onClick={go(BOOKING_ID)} />
          {/* Without the form the button above is the call already. */}
          {bookingEnabled && (
            <PhoneLink
              where="menu"
              className="flex min-h-11 items-center justify-center text-sm font-medium tracking-heading text-concrete transition-colors duration-150 hover:text-text"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
