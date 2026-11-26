import { formatWeekday } from '../../../lib/format.js';
import { addDaysISO } from '../../../lib/time.js';
import DayCell from './DayCell.jsx';

const STRIP_DAYS = 7;
const LEAD = 3; // days shown before a chosen date that lies past the first week

// Seven days from `base`; a chosen date outside them moves the row to it, never before today or past `last`.
function stripDays({ base, value, today, last }) {
  let start = base;
  if (value && (value < base || value > addDaysISO(base, STRIP_DAYS - 1))) start = addDaysISO(value, -LEAD);
  if (last && addDaysISO(start, STRIP_DAYS - 1) > last) start = addDaysISO(last, -(STRIP_DAYS - 1));
  if (start < today) start = today;
  return Array.from({ length: STRIP_DAYS }, (_, i) => addDaysISO(start, i));
}

/**
 * The folded calendar: one row of seven days, starting from the first day with free time. Each day is one tall cell
 * with its weekday in it, and on phones the row reaches into the card's padding: at 320px a day was a 32px column.
 */
export default function WeekStrip({ dates, days }) {
  const base = dates.find((iso) => !days.full.has(iso)) ?? days.today;
  const strip = stripDays({ base, value: days.value, today: days.today, last: dates.at(-1) });

  return (
    <div className="-mx-2 grid grid-cols-7 gap-0.5 text-center sm:mx-0 sm:gap-1">
      {strip.map((iso) => (
        <DayCell key={iso} iso={iso} days={days} weekday={formatWeekday(iso)} />
      ))}
    </div>
  );
}
