import { site } from '../../data/site.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { formatDuration, formatPrice, formatPriceRange } from '../../lib/format.js';
import { offers } from '../../lib/pricing.js';
import ArrowIcon from '../ArrowIcon.jsx';
import BookButton from '../BookButton.jsx';

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
      className="text-concrete transition-[transform,color] duration-150 group-open/row:rotate-45 group-hover/row:text-text motion-reduce:transition-none"
    >
      <path d="M6 1v10M1 6h10" />
    </svg>
  );
}

/** A service's booking link in the price menu: the form opens with the service chosen. */
function BookLink({ service }) {
  const { openBooking } = useBooking();
  return (
    <BookButton variant="link" track={{ where: 'price-menu', service: service.id }} onClick={() => openBooking({ service: service.id })}>
      <ArrowIcon className="transition-transform duration-150 motion-safe:group-hover:translate-x-1" />
    </BookButton>
  );
}

/** Where the price depends on the barber: who does it for how much, each row booking with that barber. */
function BarberPrices({ service }) {
  const { openBooking } = useBooking();
  return (
    <ul className="mt-4 border-t border-line">
      {site.team.filter(({ slug }) => offers(service, slug)).map(({ slug, name }) => (
        <li key={slug} className="border-b border-line">
          <BookButton
            variant="link"
            className="w-full !justify-between !normal-case !tracking-normal"
            label={<><span className="sr-only">{site.ui.cta.book}: </span>{name}</>}
            barber={slug}
            track={{ where: 'price-menu', service: service.id, barber: slug }}
            onClick={() => openBooking({ service: service.id, barber: slug })}
          >
            <span className="flex items-center gap-3 tabular-nums">
              {formatPrice(service.prices[slug])}
              <ArrowIcon className="text-concrete transition-[transform,color] duration-150 group-hover:translate-x-1 group-hover:text-text" />
            </span>
          </BookButton>
        </li>
      ))}
    </ul>
  );
}

/**
 * The services that are not cards, as a price menu: name, time and price on one row; opening a row shows what
 * the service is and the way to book it (per barber when their prices differ). Native <details>, so it works without script and with a keyboard;
 * two columns from lg, each flowing on its own so an opened row never stretches its neighbour.
 */
export default function PriceMenu({ services }) {
  return (
    <ul className="price-menu border-t border-line lg:columns-2 lg:gap-x-16">
      {services.map((service) => (
        <li key={service.id} className="break-inside-avoid border-b border-line">
          <details name={GROUP} className="group/row">
            <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block font-bold leading-snug">{service.name}</span>
                <span className="mt-1 block text-sm text-concrete">{formatDuration(service.durationMin)}</span>
                {/* Age limits and the consultation stay on the row itself, not behind the fold. */}
                {service.note && <span className="mt-1 block text-sm text-accent-light">{service.note}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-4">
                <span className="font-bold tabular-nums">{formatPriceRange(service.prices, { from: service.from === true })}</span>
                <PlusIcon />
              </span>
            </summary>
            <div className="pb-5 pr-7">
              <p className="max-w-prose text-sm leading-relaxed text-concrete">{service.description}</p>
              {new Set(Object.values(service.prices)).size > 1 ? <BarberPrices service={service} /> : <BookLink service={service} />}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
