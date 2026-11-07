import { site } from '../data/site.js';
import { addDaysISO, fromMinutes, kyivNow, toMinutes, weekdayOf } from './time.js';

export const ANY_BARBER = 'any';

const { daysAhead, slotMinutes, minLeadMinutes } = site.booking;

export function blocksFor(service) {
  return Math.ceil(service.durationMin / slotMinutes);
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

export function freeTimes({ dateISO, service, barberSlug, candidates, busy, now = kyivNow() }) {
  const day = site.hours[weekdayOf(dateISO)];
  if (!day) return [];

  const length = blocksFor(service) * slotMinutes;
  const close = toMinutes(day.close);
  const earliest = dateISO === now.dateISO ? now.minutes + minLeadMinutes : -Infinity;
  const busyOnDate = busy.filter((item) => item.date === dateISO);
  const barbers = barberSlug === ANY_BARBER ? candidates : [barberSlug];

  const times = [];
  for (let start = toMinutes(day.open); start + length <= close; start += slotMinutes) {
    if (start < earliest) continue;
    if (barbers.some((slug) => isBarberFree(slug, start, start + length, busyOnDate))) {
      times.push(fromMinutes(start));
    }
  }
  return times;
}
