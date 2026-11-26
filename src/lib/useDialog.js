import { useEffect, useState } from 'react';
import { lockScroll, unlockScroll } from './scroll.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Back to `el` only while it is still there and shown (a card in a row that has since been re-rendered, or a work
// at a width that hides it, is not).
const canTakeFocus = (el) => Boolean(el?.isConnected && el.getClientRects().length > 0);

// What a dialog laid over the page leaves behind it: the siblings of the dialog and of each of its ancestors up to
// <body>, so the whole page but the dialog's own branch.
function pageBehind(root) {
  const behind = [];
  for (let node = root; node.parentElement && node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement.children) if (sibling !== node && sibling.tagName !== 'SCRIPT') behind.push(sibling);
  }
  return behind;
}

/**
 * Modal dialog behaviour for `rootRef`: locks the page scroll, focuses `initialRef` (or the root), keeps Tab
 * inside, makes the page behind it inert, closes on Escape and hands focus back to the opener. `opener`: the
 * element that opened it; a tap does not always focus it (Safari), so document.activeElement is only the fallback.
 * Returns the root's keydown handler.
 */
export function useDialog(rootRef, initialRef, onClose, { restoreFocus = true, opener: givenOpener = null } = {}) {
  // Captured at first render: under StrictMode the effect re-runs after focus has already moved.
  const [opener] = useState(() => givenOpener ?? document.activeElement);

  useEffect(() => {
    const root = rootRef.current;
    lockScroll();
    // A dialog portaled to <body> (profile, lightbox) leaves the whole page behind it; one inside the page
    // (the menu) leaves its siblings up the tree. Neither can then be reached with Tab or a screen reader.
    const behind = root ? pageBehind(root).filter((el) => !el.inert) : [];
    behind.forEach((el) => (el.inert = true));
    (initialRef?.current ?? root)?.focus();
    return () => {
      behind.forEach((el) => (el.inert = false));
      unlockScroll();
      // Not when an action in the dialog already sent focus on (a booking button moves it to the form): the
      // cleanup runs only after the exit animation and would pull it back.
      const active = document.activeElement;
      const lost = !active || active === document.body || root?.contains(active);
      if (restoreFocus && lost && canTakeFocus(opener)) opener.focus({ preventScroll: true });
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
