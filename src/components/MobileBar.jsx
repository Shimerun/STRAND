import { useEffect, useState } from 'react';
import { site } from '../data/site.js';
import { bookingEnabled } from '../lib/booking.js';
import { BOOKING_ID } from '../lib/scroll.js';
import { EVENTS } from '../lib/track.js';
import BookButton from './BookButton.jsx';
import Button from './Button.jsx';
import PhoneIcon from './PhoneIcon.jsx';

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

const BAR_ROOM = '5rem'; // the bar's height, kept clear under a focused control while it shows (index.css)

export default function MobileBar() {
  const hidden = useOwnCtaOnScreen();
  const { cta } = site.ui;

  // Written only when the bar comes or goes; lg:hidden takes it away on a desktop, so it needs no room there.
  useEffect(() => {
    const shown = !hidden && !window.matchMedia('(min-width: 1024px)').matches;
    document.documentElement.style.setProperty('--bar', shown ? BAR_ROOM : '0px');
  }, [hidden]);

  return (
    <div
      aria-hidden={hidden || undefined}
      inert={hidden ? '' : undefined}
      className={`fixed inset-x-0 bottom-0 z-[45] border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
        hidden ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex gap-3 px-5 py-3">
        <BookButton className="flex-1 !px-3" track={{ where: 'sticky' }} />
        {/* The call as an icon, so the main action keeps its full label at 320px; without the form the main
            action is the call itself. */}
        {bookingEnabled && (
          <Button
            variant="ghost"
            aria-label={cta.call}
            className="w-12 shrink-0 !px-0"
            href={`tel:${site.phone}`}
            track={{ name: EVENTS.callClick, where: 'sticky' }}
          >
            <PhoneIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
