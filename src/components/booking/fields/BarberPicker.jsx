import { site } from '../../../data/site.js';
import CheckIcon from '../../CheckIcon.jsx';
import Img from '../../Img.jsx';
import { barberPhoto } from '../../team/photo.js';
import { FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-barber';
const CARD =
  'relative flex h-full flex-col overflow-hidden rounded border transition-colors duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent md:flex-row md:items-center md:gap-2.5 md:py-2 md:pl-2 md:pr-3';
const AVATAR = 'block aspect-[4/5] w-full overflow-hidden md:aspect-auto md:h-14 md:w-14 md:shrink-0 md:rounded';
// Phones: the caption sits on the photo's lower edge; md+ it is plain text beside the avatar.
const CAPTION =
  'absolute inset-x-0 bottom-0 min-w-0 bg-gradient-to-t from-bg/90 via-bg/60 to-transparent px-1.5 pb-1.5 pt-6 md:static md:bg-none md:p-0';

const initials = (name) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2);

/**
 * Barbers as photo cards. Phones get a 3-column grid of portrait tiles (first name and role on the photo), so every
 * barber is visible without swiping; md+ keeps compact chips (square avatar, full name, role). Without a photo the
 * card shows the initials.
 */
export default function BarberPicker({ barbers, value, error, onChange }) {
  const { fields } = site.ui.form;

  return (
    <fieldset id={ID} className="min-w-0" data-invalid={Boolean(error)} aria-describedby={error ? errorId(ID) : undefined}>
      <legend className={LABEL}>{fields.barber}</legend>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]">
        {barbers.map(({ slug, name, role }) => {
          const checked = value === slug;
          return (
            <label key={slug} className="relative min-w-0 cursor-pointer">
              <input
                type="radio"
                name="barber"
                value={slug}
                checked={checked}
                onChange={() => onChange(slug)}
                className="peer sr-only"
              />
              <span
                className={`${CARD} ${
                  checked ? 'border-text ring-1 ring-text md:bg-text md:text-bg md:ring-0' : 'border-edge hover:border-concrete'
                }`}
              >
                {/* The portraits are 3:4 with the head in the upper third: zoom on it so the face fills the frame. */}
                <span className={AVATAR}>
                  <Img
                    src={barberPhoto(slug)}
                    alt=""
                    width={4}
                    height={5}
                    className="h-full w-full origin-[50%_20%] scale-[1.4] object-cover object-top md:scale-[1.7]"
                    fallback={
                      <span className="flex h-full w-full items-center justify-center bg-bg text-xs font-extrabold text-concrete">
                        {initials(name)}
                      </span>
                    }
                  />
                </span>
                <span className={CAPTION}>
                  <span className="block truncate text-xs font-bold leading-snug md:whitespace-normal">
                    <span className="md:hidden">{name.split(' ')[0]}</span>
                    <span className="hidden md:inline">{name}</span>
                  </span>
                  <span
                    className={`mt-0.5 block text-[10px] leading-tight md:text-xs ${
                      checked ? 'text-text/75 md:text-bg/70' : 'text-text/75 md:text-concrete'
                    }`}
                  >
                    {role}
                  </span>
                </span>
                {checked && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-text text-bg md:hidden">
                    <CheckIcon size={12} />
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={ID} error={error} />
    </fieldset>
  );
}
