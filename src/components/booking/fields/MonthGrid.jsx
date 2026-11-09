import { useMemo, useState } from 'react';
import { site } from '../../../data/site.js';
import { formatMonth, formatWeekday } from '../../../lib/format.js';
import { addDaysISO, weekdayOf } from '../../../lib/time.js';
import ArrowIcon from '../../ArrowIcon.jsx';
import DayCell from './DayCell.jsx';

const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const A_MONDAY = '2024-01-01';
const WEEKDAY_NAMES = WEEK.map((_, i) => formatWeekday(addDaysISO(A_MONDAY, i)));
const MAX_MONTH_DAYS = 31;

const NAV =
  'flex h-11 w-11 items-center justify-center rounded border border-edge transition-colors duration-300 hover:border-concrete disabled:pointer-events-none disabled:opacity-30';

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

// The full month calendar over the booking window, opening on the month of the chosen date.
export default function MonthGrid({ dates, days }) {
  const { calendar } = site.ui.form;
  const months = useMemo(() => [...new Set(dates.map(monthOf))], [dates]);
  const [shown, setShown] = useState(() => Math.max(0, months.indexOf(monthOf(days.value || dates[0] || days.today))));
  const month = months[shown] ?? monthOf(days.today);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <button type="button" className={NAV} aria-label={calendar.prev} disabled={shown === 0} onClick={() => setShown(shown - 1)}>
          <ArrowIcon className="rotate-180" />
        </button>
        <p aria-live="polite" className="text-sm font-bold uppercase tracking-heading">
          {formatMonth(`${month}-01`)}
        </p>
        <button
          type="button"
          className={NAV}
          aria-label={calendar.next}
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
        {monthCells(month).map((iso, i) =>
          iso ? <DayCell key={iso} iso={iso} days={days} /> : <span key={`gap-${i}`} aria-hidden="true" />,
        )}
      </div>
    </div>
  );
}
