import { site } from '../../../data/site.js';
import { formatLongDay } from '../../../lib/format.js';
import CheckIcon from '../../CheckIcon.jsx';

const DAY =
  'relative flex h-11 items-center justify-center rounded border border-transparent text-sm font-bold tabular-nums transition-colors duration-150 hover:border-concrete peer-checked:border-text peer-checked:bg-text peer-checked:text-bg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';
const OFF = 'flex h-11 items-center justify-center text-sm tabular-nums text-concrete/40';

// The week strip puts the weekday inside the cell: the whole column is then one target, not a 44px square under a label.
const TALL = '!h-14 flex-col gap-0.5';
const WEEKDAY = 'text-[0.625rem] font-medium uppercase leading-none';

/**
 * One day of the date picker: a radio for a bookable day, a dimmed number otherwise (crossed out when it is
 * fully booked). `days`: { bookable, full, value, today, onChange, onPointerDown } shared by every cell.
 * weekday: its short name, drawn in the cell (the week strip); the month grid has a header row instead.
 */
export default function DayCell({ iso, days, weekday }) {
  const { bookable, full, value, today, onChange, onPointerDown } = days;
  const day = Number(iso.slice(8));
  const isFull = full.has(iso) && iso !== value;
  const name = weekday && <span aria-hidden="true" className={`${WEEKDAY} ${value === iso ? '' : 'text-concrete'}`}>{weekday}</span>;

  if (!bookable.has(iso) || isFull) {
    return (
      <span aria-hidden="true" className={`${OFF} ${weekday ? TALL : ''}`}>
        {name}
        <span className={isFull ? 'line-through' : ''}>{day}</span>
      </span>
    );
  }

  const label = formatLongDay(iso);
  return (
    <label className="relative cursor-pointer" onPointerDown={onPointerDown}>
      <input
        type="radio"
        name="date"
        value={iso}
        checked={value === iso}
        onChange={() => onChange(iso)}
        aria-label={iso === today ? `${site.ui.contacts.today}, ${label}` : label}
        className="peer sr-only"
      />
      <span className={`${DAY} ${weekday ? TALL : ''}`}>
        {name}
        {day}
        {value === iso && <CheckIcon size={10} className="absolute right-1 top-1" />}
        {iso === today && <span aria-hidden="true" className={`absolute h-1 w-1 rounded-full bg-current ${weekday ? 'bottom-1' : 'bottom-1.5'}`} />}
      </span>
    </label>
  );
}
