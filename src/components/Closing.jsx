import { site } from '../data/site.js';
import { formatHours } from '../lib/format.js';
import { kyivNow } from '../lib/time.js';
import BookButton from './BookButton.jsx';
import OpenBadge from './OpenBadge.jsx';

// Under the footer stencil: tagline, booking and open-now (phone and address follow in the footer).
// data-own-cta: the mobile bar does not repeat its button.
export default function Closing() {
  const { contacts } = site.ui;
  const today = site.hours[kyivNow().weekday];

  return (
    <div data-own-cta className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <p className="max-w-[18ch] text-balance text-2xl font-extrabold uppercase leading-tight tracking-heading sm:text-4xl">{site.tagline}</p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <BookButton track={{ where: 'closing' }} />
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
