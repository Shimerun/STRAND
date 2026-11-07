import { site } from '../../../data/site.js';
import { formatDayMonth, formatWeekday } from '../../../lib/format.js';
import { kyivNow } from '../../../lib/time.js';
import { CHIP, FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-date';

export default function DateField({ dates, value, error, onChange }) {
  const { form, contacts } = site.ui;
  const today = kyivNow().dateISO;

  return (
    <fieldset className="min-w-0" data-invalid={Boolean(error)} aria-describedby={error ? errorId(ID) : undefined}>
      <legend className={LABEL}>{form.fields.date}</legend>
      <div
        data-lenis-prevent
        onWheel={(event) => {
          const list = event.currentTarget;
          const maxScroll = list.scrollWidth - list.clientWidth;
          const canScroll = event.deltaY > 0 ? list.scrollLeft < maxScroll : list.scrollLeft > 0;
          if (!event.deltaY || !canScroll) return;
          event.preventDefault();
          list.scrollLeft = Math.max(0, Math.min(maxScroll, list.scrollLeft + event.deltaY));
        }}
        className="-mx-1 flex w-full min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain px-1 py-1"
      >
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
              <span className="text-xs font-medium uppercase tracking-heading">
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
