import { useEffect, useState } from 'react';
import { lockScroll, unlockScroll } from './scroll.js';

const FOCUSABLE = 'a[href], button:not([disabled])';

// Modal dialog behaviour for `rootRef`: locks the page scroll, focuses `initialRef` (or the root), keeps Tab
// inside, closes on Escape and hands focus back to the opener. Returns the root's keydown handler.
export function useDialog(rootRef, initialRef, onClose, { restoreFocus = true } = {}) {
  // Captured at first render: under StrictMode the effect re-runs after focus has already moved.
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    lockScroll();
    (initialRef?.current ?? rootRef.current)?.focus();
    return () => {
      unlockScroll();
      if (restoreFocus) opener?.focus?.({ preventScroll: true });
    };
  }, [rootRef, initialRef, opener, restoreFocus]);

  return (event) => {
    if (event.key === 'Escape') return onClose();
    if (event.key !== 'Tab') return;
    const focusable = rootRef.current.querySelectorAll(FOCUSABLE);
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
