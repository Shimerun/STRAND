import { site } from '../../../data/site.js';
import Img from '../../Img.jsx';
import { barberPhoto } from '../../team/photo.js';
import { FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-barber';
const CARD =
  'block h-full overflow-hidden rounded border transition-colors duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';

const initials = (name) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2);

// Barbers as photo cards; without a photo the card shows the initials.
export default function BarberPicker({ barbers, value, error, onChange }) {
  const { fields } = site.ui.form;

  return (
    <fieldset id={ID} data-invalid={Boolean(error)} aria-describedby={error ? errorId(ID) : undefined}>
      <legend className={LABEL}>{fields.barber}</legend>
      <div className="grid grid-cols-3 gap-2">
        {barbers.map(({ slug, name, role }) => {
          const checked = value === slug;
          return (
            <label key={slug} className="relative cursor-pointer">
              <input
                type="radio"
                name="barber"
                value={slug}
                checked={checked}
                onChange={() => onChange(slug)}
                className="peer sr-only"
              />
              <span className={`${CARD} ${checked ? 'border-text' : 'border-edge hover:border-concrete'}`}>
                <Img
                  src={barberPhoto(slug)}
                  alt=""
                  width={1}
                  height={1}
                  className="aspect-square w-full object-cover"
                  fallback={
                    <span className="flex aspect-square w-full items-center justify-center bg-bg text-xl font-extrabold tracking-heading text-concrete">
                      {initials(name)}
                    </span>
                  }
                />
                <span className={`block px-2 py-2 transition-colors duration-300 ${checked ? 'bg-text text-bg' : ''}`}>
                  <span className="block text-xs font-bold leading-snug">{name}</span>
                  <span className={`mt-0.5 block text-xs ${checked ? 'text-bg/70' : 'text-concrete'}`}>{role}</span>
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
