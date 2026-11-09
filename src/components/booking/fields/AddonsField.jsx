import { useState } from 'react';
import { site } from '../../../data/site.js';
import { formatDuration, formatPrice } from '../../../lib/format.js';
import { isFromPrice, minPrice, priceFor } from '../../../lib/pricing.js';
import CheckIcon from '../../CheckIcon.jsx';
import Img from '../../Img.jsx';
import { servicePhoto } from '../servicePhoto.js';
import { tooLong } from '../useAddons.js';
import { LABEL, TOGGLE } from './Field.jsx';

const LIST_ID = 'booking-addons';
const ROW =
  'flex h-full min-h-11 items-center gap-3 rounded border px-3 py-3 transition-colors duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';
const THUMB = 48; // px

// Optional extras to the main service, folded behind a toggle; ones that would make the visit too long are disabled.
export default function AddonsField({ barber, extras, onToggle }) {
  const [open, setOpen] = useState(false);
  const { options, addons, services } = extras;
  if (options.length === 0) return null;

  const { form } = site.ui;
  const priceOf = (addon) =>
    barber
      ? formatPrice(priceFor(addon.id, barber), { from: addon.from === true })
      : formatPrice(minPrice(addon), { from: isFromPrice(addon) });
  const isFull = options.some((addon) => !addons.includes(addon) && tooLong(services, addon));

  return (
    <fieldset>
      <legend className={LABEL}>{form.fields.addons}</legend>
      <button type="button" aria-expanded={open} aria-controls={LIST_ID} onClick={() => setOpen(!open)} className={TOGGLE}>
        <span>{open ? form.addonsHide : form.addonsAdd}</span>
        {addons.length > 0 && (
          <span className="text-xs font-medium text-concrete">
            {form.addonsChosen} {addons.length}
          </span>
        )}
      </button>

      <ul id={LIST_ID} className={`mt-2 gap-2 md:grid-cols-2 ${open ? 'grid' : 'hidden'}`}>
        {options.map((addon) => {
          const checked = addons.includes(addon);
          const disabled = !checked && tooLong(services, addon);
          return (
            <li key={addon.id}>
              <label className={`relative block h-full ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  name="addons"
                  value={addon.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(addon.id)}
                  className="peer sr-only"
                />
                <span className={`${ROW} ${checked ? 'border-text' : 'border-edge'} ${checked || disabled ? '' : 'hover:border-concrete'}`}>
                  <Img
                    src={servicePhoto(addon.id, barber)}
                    alt=""
                    width={THUMB}
                    height={THUMB}
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{addon.name}</span>
                    <span className="mt-1 block text-xs text-concrete">
                      {formatDuration(addon.durationMin)} · {priceOf(addon)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-text bg-text text-bg' : 'border-edge'}`}
                  >
                    {checked && <CheckIcon />}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {open && isFull && <p className="mt-2 text-sm text-concrete">{form.addonsFull}</p>}
    </fieldset>
  );
}
