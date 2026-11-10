import { useEffect, useState } from 'react';
import { site } from '../data/site.js';
import { BOOKING_ID, scrollToId } from '../lib/scroll.js';
import { EVENTS } from '../lib/track.js';
import Button from './Button.jsx';

// Wherever the page shows a booking button of its own (marked data-own-cta), and over the form itself.
const OWN_CTA = `#${BOOKING_ID}, [data-own-cta]`;

// The bar steps aside while one of those is on screen: there it would only repeat the button, and on the first
// screen it covered the second one. Starts hidden, so it never flashes over the hero while the page loads.
function useOwnCtaOnScreen() {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setOnScreen(visible.size > 0);
    });
    document.querySelectorAll(OWN_CTA).forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return onScreen;
}

export default function MobileBar() {
  const hidden = useOwnCtaOnScreen();
  const { cta } = site.ui;

  return (
    <div
      aria-hidden={hidden || undefined}
      inert={hidden ? '' : undefined}
      className={`fixed inset-x-0 bottom-0 z-[45] border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
        hidden ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex gap-3 px-5 py-3">
        <Button className="flex-1 !px-3" track={{ name: EVENTS.bookClick, where: 'sticky' }} onClick={() => scrollToId(BOOKING_ID)}>
          {cta.book}
        </Button>
        <Button
          variant="ghost"
          className="flex-1 !px-3"
          href={`tel:${site.phone}`}
          track={{ name: EVENTS.callClick, where: 'sticky' }}
        >
          {cta.call}
        </Button>
      </div>
    </div>
  );
}
