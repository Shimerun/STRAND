import { useEffect, useState } from 'react';
import { lockScroll, unlockScroll } from './scroll.js';

const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * Modal dialog behaviour for the element in `rootRef`: locks the page scroll, moves focus to `initialRef`
 * (or the root), keeps Tab inside, closes on Escape and hands focus back to the element that opened it.
 * Returns the keydown handler for the root.
 */
export function useDialog(rootRef, initialRef, onClose) {
  // Captured at first render: under StrictMode the effect re-runs after focus has already moved.
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    lockScroll();
    (initialRef?.current ?? rootRef.current)?.focus();
    return () => {
      unlockScroll();
      opener?.focus?.({ preventScroll: true });
    };
  }, [rootRef, initialRef, opener]);

  return (event) => {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
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
