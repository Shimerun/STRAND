import { site } from '../data/site.js';
import { addDaysISO, fromMinutes, kyivNow, toMinutes, weekdayOf } from './time.js';

const { daysAhead, slotMinutes, minLeadMinutes } = site.booking;

// Whole slots a visit of `durationMin` minutes takes.
export function blocksFor(durationMin) {
  return Math.ceil(durationMin / slotMinutes);
}

// Next `daysAhead` Kyiv dates, closed days skipped.
export function bookingDates(todayISO = kyivNow().dateISO) {
  return Array.from({ length: daysAhead }, (_, i) => addDaysISO(todayISO, i)).filter(
    (iso) => site.hours[weekdayOf(iso)],
  );
}

function isBarberFree(slug, start, end, busyOnDate) {
  return !busyOnDate.some((item) => {
    if (item.barber !== slug) return false;
    const itemStart = toMinutes(item.time);
    const itemEnd = itemStart + item.blocks * slotMinutes;
    return itemStart < end && start < itemEnd;
  });
}

// Dates out of `dates` on which the barber has no free time left for a visit of `durationMin`.
export function fullDates({ dates, durationMin, barberSlug, busy, now = kyivNow() }) {
  return new Set(dates.filter((dateISO) => freeTimes({ dateISO, durationMin, barberSlug, busy, now }).length === 0));
}

export function freeTimes({ dateISO, durationMin, barberSlug, busy, now = kyivNow() }) {
  const day = site.hours[weekdayOf(dateISO)];
  if (!day) return [];

  const length = blocksFor(durationMin) * slotMinutes;
  const close = toMinutes(day.close);
  const earliest = dateISO === now.dateISO ? now.minutes + minLeadMinutes : -Infinity;
  const busyOnDate = busy.filter((item) => item.date === dateISO);
  const times = [];
  for (let start = toMinutes(day.open); start + length <= close; start += slotMinutes) {
    if (start < earliest) continue;
    if (isBarberFree(barberSlug, start, start + length, busyOnDate)) {
      times.push(fromMinutes(start));
    }
  }
  return times;
}
