import { useMemo, useState } from 'react';
import { site } from '../../../data/site.js';
import { formatLongDay, formatMonth, formatWeekday } from '../../../lib/format.js';
import { addDaysISO, kyivNow, weekdayOf } from '../../../lib/time.js';
import ArrowIcon from '../../ArrowIcon.jsx';
import { FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-date';
const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const A_MONDAY = '2024-01-01';
const WEEKDAY_NAMES = WEEK.map((_, i) => formatWeekday(addDaysISO(A_MONDAY, i)));
const MAX_MONTH_DAYS = 31;

const NAV =
  'flex h-11 w-11 items-center justify-center rounded border border-edge transition-colors duration-300 hover:border-concrete disabled:pointer-events-none disabled:opacity-30';
const DAY =
  'relative flex h-11 items-center justify-center rounded border border-transparent text-sm font-bold tabular-nums transition-colors duration-300 hover:border-concrete peer-checked:border-text peer-checked:bg-text peer-checked:text-bg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';
const OFF = 'flex h-11 items-center justify-center text-sm tabular-nums text-concrete/40';

const monthOf = (iso) => iso.slice(0, 7);

// Cells of a Monday-first month grid: null for the days before the 1st, then the ISO dates.
function monthCells(month) {
  const first = `${month}-01`;
  const days = [];
  for (let i = 0; i < MAX_MONTH_DAYS; i++) {
    const iso = addDaysISO(first, i);
    if (monthOf(iso) !== month) break;
    days.push(iso);
  }
  return [...Array(WEEK.indexOf(weekdayOf(first))).fill(null), ...days];
}

// Month calendar over the booking window. `full`: dates with no free time left (crossed out).
export default function DateField({ dates, full, value, error, onChange }) {
  const { form, contacts } = site.ui;
  const today = kyivNow().dateISO;
  const bookable = useMemo(() => new Set(dates), [dates]);
  const months = useMemo(() => [...new Set(dates.map(monthOf))], [dates]);
  const [shown, setShown] = useState(() => Math.max(0, months.indexOf(monthOf(value || dates[0] || today))));
  const month = months[shown] ?? monthOf(today);

  return (
    <fieldset className="min-w-0" data-invalid={Boolean(error)} aria-describedby={error ? errorId(ID) : undefined}>
      <legend className={LABEL}>{form.fields.date}</legend>

      <div className="flex items-center justify-between gap-4">
        <button type="button" className={NAV} aria-label={form.calendar.prev} disabled={shown === 0} onClick={() => setShown(shown - 1)}>
          <ArrowIcon className="rotate-180" />
        </button>
        <p aria-live="polite" className="text-sm font-bold uppercase tracking-heading">
          {formatMonth(`${month}-01`)}
        </p>
        <button
          type="button"
          className={NAV}
          aria-label={form.calendar.next}
          disabled={shown >= months.length - 1}
          onClick={() => setShown(shown + 1)}
        >
          <ArrowIcon />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_NAMES.map((name) => (
          <span key={name} aria-hidden="true" className="pb-1 text-xs font-medium uppercase text-concrete">
            {name}
          </span>
        ))}
        {monthCells(month).map((iso, i) => {
          if (!iso) return <span key={`gap-${i}`} aria-hidden="true" />;
          const day = Number(iso.slice(8));
          const isFull = full.has(iso) && iso !== value;
          if (!bookable.has(iso) || isFull) {
            return (
              <span key={iso} aria-hidden="true" className={`${OFF} ${isFull ? 'line-through' : ''}`}>
                {day}
              </span>
            );
          }
          const label = formatLongDay(iso);
          return (
            <label key={iso} className="relative cursor-pointer">
              <input
                type="radio"
                name="date"
                value={iso}
                checked={value === iso}
                onChange={() => onChange(iso)}
                aria-label={iso === today ? `${contacts.today}, ${label}` : label}
                className="peer sr-only"
              />
              <span className={DAY}>
                {day}
                {iso === today && <span aria-hidden="true" className="absolute bottom-1.5 h-1 w-1 rounded-full bg-current" />}
              </span>
            </label>
          );
        })}
      </div>

      <FieldError id={ID} error={error} />
    </fieldset>
  );
}
