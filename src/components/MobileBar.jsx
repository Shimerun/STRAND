import { useEffect, useState } from 'react';
import { site } from '../data/site.js';
import { phoneOnly } from '../lib/booking.js';
import { HEADER_HEIGHT } from '../lib/scroll.js';
import { EVENTS } from '../lib/track.js';
import { usePrefersReducedMotion } from '../lib/useMediaQuery.js';
import BookButton from './BookButton.jsx';
import Button from './Button.jsx';
import PhoneIcon from './PhoneIcon.jsx';

// A booking button of the page's own (data-own-cta) counts once it is wholly on screen and clear of the header:
// a clipped one, half under the fold, cannot be tapped with confidence.
const OWN_CTA = '[data-own-cta]';
const WHOLE = 0.98;
// The booking form (data-own-cta-region) counts once it is in the upper three quarters of the screen, where the bar
// would cover its fields, not as soon as the section's title peeks in at the bottom.
const OWN_REGION = '[data-own-cta-region]';
const REGION_MARGIN = `-${HEADER_HEIGHT}px 0px -25% 0px`;

// The bar steps aside while one of those is on screen: there it would only repeat the button, and on the first
// screen it covered the second one. Starts hidden, so it never flashes over the hero while the page loads.
// Looks the targets up again when the motion preference changes, since the hero then renders other buttons.
function useOwnCtaOnScreen() {
  const [onScreen, setOnScreen] = useState(true);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const visible = new Set();
    const update = (entries, counts) => {
      for (const entry of entries) {
        if (counts(entry)) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setOnScreen(visible.size > 0);
    };
    const buttons = new IntersectionObserver((entries) => update(entries, (e) => e.isIntersecting && e.intersectionRatio >= WHOLE), {
      rootMargin: `-${HEADER_HEIGHT}px 0px 0px 0px`,
      threshold: [0, WHOLE, 1],
    });
    const regions = new IntersectionObserver((entries) => update(entries, (e) => e.isIntersecting), { rootMargin: REGION_MARGIN });
    document.querySelectorAll(OWN_CTA).forEach((target) => buttons.observe(target));
    document.querySelectorAll(OWN_REGION).forEach((target) => regions.observe(target));
    return () => {
      buttons.disconnect();
      regions.disconnect();
    };
  }, [reduce]);

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
        {/* min-w-0 + anywhere: at 200% text the label wraps inside the bar instead of running off the screen. */}
        <BookButton className="min-w-0 flex-1 !px-3 [overflow-wrap:anywhere]" track={{ where: 'sticky' }} />
        {/* The call as an icon, so the main action keeps its full label at 320px; when booking is by phone
            only, the main action is the call itself. */}
        {!phoneOnly && (
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
