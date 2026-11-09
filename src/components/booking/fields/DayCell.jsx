import { site } from '../../../data/site.js';
import { formatLongDay } from '../../../lib/format.js';

const DAY =
  'relative flex h-11 items-center justify-center rounded border border-transparent text-sm font-bold tabular-nums transition-colors duration-300 hover:border-concrete peer-checked:border-text peer-checked:bg-text peer-checked:text-bg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';
const OFF = 'flex h-11 items-center justify-center text-sm tabular-nums text-concrete/40';

/**
 * One day of the date picker: a radio for a bookable day, a dimmed number otherwise (crossed out when it is
 * fully booked). `days`: { bookable, full, value, today, onChange, onPointerDown } shared by every cell.
 */
export default function DayCell({ iso, days }) {
  const { bookable, full, value, today, onChange, onPointerDown } = days;
  const day = Number(iso.slice(8));
  const isFull = full.has(iso) && iso !== value;

  if (!bookable.has(iso) || isFull) {
    return (
      <span aria-hidden="true" className={`${OFF} ${isFull ? 'line-through' : ''}`}>
        {day}
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
      <span className={DAY}>
        {day}
        {iso === today && <span aria-hidden="true" className="absolute bottom-1.5 h-1 w-1 rounded-full bg-current" />}
      </span>
    </label>
  );
}
