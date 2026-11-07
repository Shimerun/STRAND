import { site } from '../../../data/site.js';
import { formatDayMonth, formatWeekday } from '../../../lib/format.js';
import { kyivNow } from '../../../lib/time.js';
import { CHIP, FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-date';

export default function DateField({ dates, value, error, onChange }) {
  const { form, contacts } = site.ui;
  const today = kyivNow().dateISO;

  return (
    <fieldset data-invalid={Boolean(error)} aria-describedby={error ? errorId(ID) : undefined}>
      <legend className={LABEL}>{form.fields.date}</legend>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]">
        {dates.map((iso) => (
          <label key={iso} className="relative shrink-0 cursor-pointer">
            <input
              type="radio"
              name="date"
              value={iso}
              checked={value === iso}
              onChange={() => onChange(iso)}
              className="peer sr-only"
            />
            <span className={`${CHIP} min-w-[4.75rem]`}>
              <span className="text-[0.6875rem] font-medium uppercase tracking-heading">
                {iso === today ? contacts.today : formatWeekday(iso)}
              </span>
              <span className="mt-0.5 whitespace-nowrap text-sm font-bold">{formatDayMonth(iso)}</span>
            </span>
          </label>
        ))}
      </div>
      <FieldError id={ID} error={error} />
    </fieldset>
  );
}
