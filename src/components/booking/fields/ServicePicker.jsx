import { useEffect, useRef, useState } from 'react';
import { site } from '../../../data/site.js';
import { formatDuration, formatPrice } from '../../../lib/format.js';
import { isFromPrice, minPrice, priceFor } from '../../../lib/pricing.js';
import CheckIcon from '../../CheckIcon.jsx';
import Img from '../../Img.jsx';
import { servicePhoto } from '../servicePhoto.js';
import Field, { CONTROL, borderFor, controlProps } from './Field.jsx';

const ID = 'booking-service';
const LIST_ID = `${ID}-list`;
const optionId = (serviceId) => `${ID}-option-${serviceId}`;
const OPEN_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Enter', ' ']);
const THUMB = 40; // px

/**
 * Select-only combobox (WAI-ARIA APG): focus stays on the button, the arrows move the active option,
 * Enter / Space picks it, Escape or leaving the field closes the list. Shows length and price per service.
 */
export default function ServicePicker({ services, barber, value, error, hint, onChange }) {
  const { form } = site.ui;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const selectedIndex = services.findIndex((service) => service.id === value);
  const selected = services[selectedIndex] ?? null;
  const activeService = open ? services[active] : null;

  const priceOf = (service) =>
    barber
      ? formatPrice(priceFor(service.id, barber), { from: service.from === true })
      : formatPrice(minPrice(service), { from: isFromPrice(service) });

  const show = () => {
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
  };
  const choose = (index) => {
    if (services[index]) onChange(services[index].id);
    setOpen(false);
  };

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (event) => {
    if (!open) {
      if (!OPEN_KEYS.has(event.key)) return;
      event.preventDefault();
      show();
      return;
    }
    const last = services.length - 1;
    const moves = {
      ArrowDown: () => setActive(Math.min(active + 1, last)),
      ArrowUp: () => setActive(Math.max(active - 1, 0)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => setOpen(false),
    };
    if (!moves[event.key]) return;
    event.preventDefault();
    moves[event.key]();
  };

  return (
    <Field id={ID} label={form.fields.service} error={error} hint={hint}>
      <div className="relative">
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={LIST_ID}
          aria-activedescendant={activeService ? optionId(activeService.id) : undefined}
          {...controlProps(ID, error, hint)}
          // Keyboard clicks (detail 0) are handled in onKeyDown; this is for the mouse and touch.
          onClick={(event) => event.detail !== 0 && (open ? setOpen(false) : show())}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className={`${CONTROL} ${borderFor(error)} flex items-center justify-between gap-3 pr-11 text-left`}
        >
          <span className="flex min-w-0 items-center gap-3">
            {selected && (
              <Img src={servicePhoto(selected.id, barber)} alt="" width={32} height={32} className="-my-1 h-8 w-8 shrink-0 rounded object-cover" />
            )}
            <span className={`truncate ${selected ? '' : 'text-concrete'}`}>
              {selected ? selected.name : form.placeholders.service}
            </span>
          </span>
          {selected && <span className="shrink-0 text-sm text-concrete">{priceOf(selected)}</span>}
        </button>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-concrete transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <ul
          ref={listRef}
          id={LIST_ID}
          role="listbox"
          aria-label={form.fields.service}
          data-lenis-prevent
          onMouseDown={(event) => event.preventDefault()}
          className={`absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto overscroll-contain rounded border border-edge bg-bg py-1 shadow-2xl shadow-black/60 ${open ? '' : 'hidden'}`}
        >
          {services.map((service, index) => {
            const isSelected = service.id === value;
            return (
              <li
                key={service.id}
                id={optionId(service.id)}
                role="option"
                aria-selected={isSelected}
                onMouseMove={() => index !== active && setActive(index)}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors duration-150 ${index === active ? 'bg-line' : ''}`}
              >
                <Img src={servicePhoto(service.id, barber)} alt="" width={THUMB} height={THUMB} className="h-10 w-10 shrink-0 rounded object-cover" />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{service.name}</span>
                  <span className="mt-0.5 block text-xs text-concrete">
                    {formatDuration(service.durationMin)} · {priceOf(service)}
                  </span>
                </span>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">{isSelected && <CheckIcon />}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </Field>
  );
}
