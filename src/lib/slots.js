import { site } from '../data/site.js';
import { addDaysISO, fromMinutes, kyivNow, toMinutes, weekdayOf } from './time.js';

const { daysAhead, slotMinutes, minLeadMinutes } = site.booking;

export function blocksFor(durationMin) {
  return Math.ceil(durationMin / slotMinutes);
}

// Next `daysAhead` Kyiv dates that still have a slot: closed days skipped, and today once its last slot is inside
// the lead time (the form used to open on an evening "today" with nothing to pick).
export function bookingDates(now = kyivNow()) {
  return Array.from({ length: daysAhead }, (_, i) => addDaysISO(now.dateISO, i)).filter(
    (dateISO) => freeTimes({ dateISO, durationMin: slotMinutes, barberSlug: '', busy: [], now }).length > 0,
  );
}

// Dates out of `dates` on which the barber has no free time left for a visit of `durationMin`.
export function fullDates({ dates, durationMin, barberSlug, busy, now = kyivNow() }) {
  return new Set(dates.filter((dateISO) => freeTimes({ dateISO, durationMin, barberSlug, busy, now }).length === 0));
}

export function freeTimes({ dateISO, durationMin, barberSlug, busy, now = kyivNow() }) {
  const day = site.hours[weekdayOf(dateISO)];
  // A past date (tab left open past midnight) is never bookable; the server rejects it too.
  if (!day || dateISO < now.dateISO) return [];

  const length = blocksFor(durationMin) * slotMinutes;
  const close = toMinutes(day.close);
  const earliest = dateISO === now.dateISO ? now.minutes + minLeadMinutes : -Infinity;
  // The barber's visits that day as [start, end) minutes.
  const taken = busy
    .filter((item) => item.date === dateISO && item.barber === barberSlug)
    .map(({ time, blocks }) => [toMinutes(time), toMinutes(time) + blocks * slotMinutes]);
  const times = [];
  for (let start = toMinutes(day.open); start + length <= close; start += slotMinutes) {
    const end = start + length;
    if (start >= earliest && !taken.some(([from, to]) => from < end && start < to)) times.push(fromMinutes(start));
  }
  return times;
}
