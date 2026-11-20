import { useEffect, useState } from 'react';
import { lockScroll, unlockScroll } from './scroll.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Modal dialog behaviour for `rootRef`: locks the page scroll, focuses `initialRef` (or the root), keeps Tab
// inside, closes on Escape and hands focus back to the opener. Returns the root's keydown handler.
export function useDialog(rootRef, initialRef, onClose, { restoreFocus = true } = {}) {
  // Captured at first render: under StrictMode the effect re-runs after focus has already moved.
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    const root = rootRef.current;
    lockScroll();
    (initialRef?.current ?? root)?.focus();
    return () => {
      unlockScroll();
      // Not when an action in the dialog already sent focus on (a booking button moves it to the form): the
      // cleanup runs only after the exit animation and would pull it back.
      const active = document.activeElement;
      const lost = !active || active === document.body || root?.contains(active);
      if (restoreFocus && lost) opener?.focus?.({ preventScroll: true });
    };
  }, [rootRef, initialRef, opener, restoreFocus]);

  return (event) => {
    if (event.key === 'Escape') return onClose();
    if (event.key !== 'Tab') return;
    // Only what is shown: a control hidden at this width (display: none) can never take focus, and the wrap
    // would wait for it while Tab walks out of the dialog.
    const focusable = [...rootRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
