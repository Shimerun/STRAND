import { site } from '../../../data/site.js';
import { formatPrice } from '../../../lib/format.js';
import { priceFor } from '../../../lib/pricing.js';
import CheckIcon from '../../CheckIcon.jsx';
import BarberPhoto from '../../team/BarberPhoto.jsx';
import { FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-barber';
const CARD =
  'flex h-full min-h-14 items-center gap-3 rounded border py-2 pl-2 pr-3 transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';

/**
 * Barbers as rows: avatar (initials without a photo), full name, role, and once a service is chosen its price at
 * each barber, so they compare at a glance. One column on phones, so long names never get cut. The chosen one is
 * inverted and ticked (not told by colour alone).
 */
export default function BarberPicker({ barbers, service, value, error, onChange }) {
  const { fields, notOffered } = site.ui.form;

  return (
    <fieldset id={ID} className="min-w-0" data-invalid={Boolean(error)} aria-describedby={error ? errorId(ID) : undefined}>
      <legend className={LABEL}>{fields.barber}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {barbers.map(({ slug, name, role }) => {
          const checked = value === slug;
          const price = service ? priceFor(service.id, slug) : null;
          return (
            <label key={slug} className="relative min-w-0 cursor-pointer">
              <input type="radio" name="barber" value={slug} checked={checked} onChange={() => onChange(slug)} className="peer sr-only" />
              <span className={`${CARD} ${checked ? 'border-text bg-text text-bg' : 'border-edge hover:border-concrete'}`}>
                {/* The portraits are 3:4 with the head in the upper third: zoom on it so the face fills the frame. */}
                <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded">
                  <BarberPhoto
                    barber={{ slug, name }}
                    width={4}
                    height={5}
                    className="h-full w-full origin-[50%_20%] scale-[1.7] object-cover object-top"
                    fallbackClassName="h-full border border-line bg-bg text-xs"
                  />
                  {checked && (
                    <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-text text-bg">
                      <CheckIcon size={10} />
                    </span>
                  )}
                </span>
                {/* The name gets the whole first line (at 320px "Зайнчковська" leaves no room beside it); the price
                    ends the second, so prices still line up down the right edge. */}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-snug">{name}</span>
                  {/* Wraps, so "does not offer it" takes its own line where it does not fit beside a long role. */}
                  <span className={`mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs leading-tight ${checked ? 'text-bg/70' : 'text-concrete'}`}>
                    <span>{role}</span>
                    {service && (
                      <span className={`text-right ${price === null ? '' : `shrink-0 text-sm font-bold tabular-nums ${checked ? 'text-bg' : 'text-text'}`}`}>
                        {price === null ? notOffered : formatPrice(price, { from: service.from === true })}
                      </span>
                    )}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={ID} error={error} />
    </fieldset>
  );
}
