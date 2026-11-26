import { site } from '../data/site.js';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Old iOS knows only "Europe/Kiev"; undefined falls back to browser local time.
function pickTimeZone(candidates) {
  for (const timeZone of candidates) {
    if (!timeZone) continue;
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone });
      return timeZone;
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  return undefined;
}

const TZ = pickTimeZone([site.timezone, 'Europe/Kiev']);

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function kyivNow(date = new Date()) {
  const parts = {};
  for (const { type, value } of partsFormatter.formatToParts(date)) parts[type] = value;
  return {
    dateISO: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday.slice(0, 3).toLowerCase(),
    // Some engines report midnight as "24" despite h23.
    minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
  };
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const utcDate = (iso) => new Date(`${iso}T00:00:00Z`);

export function addDaysISO(iso, n) {
  const d = utcDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(iso) {
  return WEEKDAYS[utcDate(iso).getUTCDay()];
}

export function isOpenNow(hours, now = kyivNow()) {
  const day = hours?.[now.weekday];
  return Boolean(day) && now.minutes >= toMinutes(day.open) && now.minutes < toMinutes(day.close);
}

/** "HH:MM" the shop next opens at, seen from `now` while it is closed; null when no day has hours. */
export function nextOpening(hours, now = kyivNow()) {
  const today = WEEKDAYS.indexOf(now.weekday);
  for (let ahead = 0; ahead <= WEEKDAYS.length; ahead += 1) { // up to the same weekday next week
    const day = hours?.[WEEKDAYS[(today + ahead) % WEEKDAYS.length]];
    if (day && (ahead > 0 || now.minutes < toMinutes(day.open))) return day.open;
  }
  return null;
}
