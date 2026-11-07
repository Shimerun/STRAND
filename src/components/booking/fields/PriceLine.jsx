import { site } from '../../../data/site.js';
import { formatPrice } from '../../../lib/format.js';
import { minPrice, priceFor } from '../../../lib/pricing.js';
import { ANY_BARBER } from '../../../lib/slots.js';

export default function PriceLine({ barber, service }) {
  if (!service) return null;

  const price =
    barber === ANY_BARBER
      ? formatPrice(minPrice(service), { from: true })
      : formatPrice(priceFor(service.id, barber), { from: service.from === true });

  return (
    <div className="rounded border border-line px-4 py-3 text-sm">
      <p className="flex items-baseline justify-between gap-4">
        <span className="text-concrete">{site.ui.form.priceLabel}</span>
        <span className="font-bold">{price}</span>
      </p>
      {service.note && <p className="mt-1 text-xs text-concrete">{service.note}</p>}
    </div>
  );
}
