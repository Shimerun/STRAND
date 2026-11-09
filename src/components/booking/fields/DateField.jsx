import { useMemo, useRef, useState } from 'react';
import { site } from '../../../data/site.js';
import { formatLongDay } from '../../../lib/format.js';
import { kyivNow } from '../../../lib/time.js';
import ArrowIcon from '../../ArrowIcon.jsx';
import { FieldError, LABEL, TOGGLE, errorId } from './Field.jsx';
import MonthGrid from './MonthGrid.jsx';
import WeekStrip from './WeekStrip.jsx';

const ID = 'booking-date';
const PICKER_ID = 'booking-date-picker';

/**
 * Date picker over the booking window, folded to one row of days (WeekStrip); the toggle opens the month
 * calendar (MonthGrid). Picking a day there with a tap or click folds it back; arrow keys only move the
 * choice, so keyboard users keep their place. `full`: dates with no free time left (crossed out).
 */
export default function DateField({ dates, full, value, error, onChange }) {
  const { form } = site.ui;
  const [open, setOpen] = useState(false);
  const pointerPick = useRef(false);
  const bookable = useMemo(() => new Set(dates), [dates]);

  const pick = (iso) => {
    onChange(iso);
    if (pointerPick.current) setOpen(false);
    pointerPick.current = false;
  };
  const days = {
    bookable,
    full,
    value,
    today: kyivNow().dateISO,
    onChange: pick,
    onPointerDown: () => {
      pointerPick.current = true;
    },
  };

  return (
    <fieldset
      className="min-w-0"
      data-invalid={Boolean(error)}
      aria-describedby={error ? errorId(ID) : undefined}
      onKeyDown={() => {
        pointerPick.current = false;
      }}
    >
      <legend className={LABEL}>{form.fields.date}</legend>

      <div id={PICKER_ID}>{open ? <MonthGrid dates={dates} days={days} /> : <WeekStrip dates={dates} days={days} />}</div>

      <button type="button" aria-expanded={open} aria-controls={PICKER_ID} onClick={() => setOpen(!open)} className={`mt-3 ${TOGGLE}`}>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <ArrowIcon className={`transition-transform duration-300 ${open ? '-rotate-90' : 'rotate-90'}`} />
          {open ? form.calendar.collapse : form.calendar.expand}
        </span>
        {/* The row may cross into the next month, so the chosen day is named with its month. */}
        {value && <span className="whitespace-nowrap text-xs font-medium text-concrete">{formatLongDay(value)}</span>}
      </button>

      <FieldError id={ID} error={error} />
    </fieldset>
  );
}
