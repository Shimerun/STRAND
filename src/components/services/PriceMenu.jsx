import { site } from '../../data/site.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { formatDuration, formatPrice } from '../../lib/format.js';
import { isFromPrice, minPrice } from '../../lib/pricing.js';
import { EVENTS } from '../../lib/track.js';
import ArrowIcon from '../ArrowIcon.jsx';
import Button from '../Button.jsx';

const GROUP = 'price-menu'; // details that share a name close one another

// A plus that turns into a cross while its row is open.
function PlusIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="text-concrete transition-[transform,color] duration-300 group-open/row:rotate-45 group-hover/row:text-text motion-reduce:transition-none"
    >
      <path d="M6 1v10M1 6h10" />
    </svg>
  );
}

/**
 * The services that are not cards, as a price menu: name, time and price on one row; opening a row shows what
 * the service is and the way to book it. Native <details>, so it works without script and with a keyboard;
 * two columns from lg, each flowing on its own so an opened row never stretches its neighbour.
 */
export default function PriceMenu({ services }) {
  const { openBooking } = useBooking();
  const { cta } = site.ui;

  return (
    <ul className="price-menu border-t border-line lg:columns-2 lg:gap-x-16">
      {services.map((service) => (
        <li key={service.id} className="break-inside-avoid border-b border-line">
          <details name={GROUP} className="group/row">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block text-sm font-bold">{service.name}</span>
                <span className="mt-1 block text-xs text-concrete">
                  {[formatDuration(service.durationMin), service.note].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-4 pt-0.5">
                <span className="text-sm font-bold tabular-nums">{formatPrice(minPrice(service), { from: isFromPrice(service) })}</span>
                <PlusIcon />
              </span>
            </summary>
            <div className="pb-5 pr-7">
              <p className="max-w-prose text-sm leading-relaxed text-concrete">{service.description}</p>
              <Button
                variant="link"
                className="mt-1"
                track={{ name: EVENTS.bookClick, where: 'price-menu', service: service.id }}
                onClick={() => openBooking({ service: service.id })}
              >
                {cta.book}
                <ArrowIcon className="transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
              </Button>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
