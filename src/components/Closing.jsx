import { site } from '../data/site.js';
import { formatHours } from '../lib/format.js';
import { BOOKING_ID, scrollToId } from '../lib/scroll.js';
import { kyivNow } from '../lib/time.js';
import { EVENTS } from '../lib/track.js';
import Button from './Button.jsx';
import OpenBadge from './OpenBadge.jsx';

/**
 * The last word of the page, under the footer stencil: the tagline the page opened with, the way to book and
 * whether the shop is open right now. Marked data-own-cta, so the mobile bar does not repeat its button.
 * The phone and the address follow in the footer itself and are not repeated here.
 */
export default function Closing() {
  const { cta, contacts } = site.ui;
  const today = site.hours[kyivNow().weekday];

  return (
    <div data-own-cta className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <p className="max-w-[18ch] text-balance text-2xl font-extrabold uppercase leading-tight tracking-heading sm:text-4xl">{site.tagline}</p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Button track={{ name: EVENTS.bookClick, where: 'closing' }} onClick={() => scrollToId(BOOKING_ID)}>
          {cta.book}
        </Button>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <OpenBadge />
          <span className="text-xs font-medium uppercase tracking-heading text-concrete">
            {contacts.today} <span className="tabular-nums">{formatHours(today, contacts.closed)}</span>
          </span>
        </p>
      </div>
    </div>
  );
}
