import { useEffect, useState } from 'react';
import { site } from '../data/site.js';
import { BOOKING_ID, scrollToId } from '../lib/scroll.js';
import { EVENTS } from '../lib/track.js';
import Button from './Button.jsx';

// Hidden while the booking form is on screen: the bar would only cover it.
function useBookingVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(BOOKING_ID);
    if (!target) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return visible;
}

export default function MobileBar() {
  const hidden = useBookingVisible();
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
