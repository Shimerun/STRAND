import { site } from '../data/site.js';

const NBSP = ' ';
const { units } = site.ui;
const priceFormatter = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });

export function pluralUk(n, [one, few, many]) {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function formatDuration(min) {
  const hours = Math.floor(min / 60);
  const rest = min % 60;
  const parts = [];
  if (hours) parts.push(`${hours}${NBSP}${units.hour}`);
  if (rest || !hours) parts.push(`${rest}${NBSP}${units.min}`);
  return parts.join(' ');
}

export function formatPrice(n, { from = false } = {}) {
  const price = `${priceFormatter.format(n)}${NBSP}${units.currency}`;
  return from ? `${site.ui.services.from}${NBSP}${price}` : price;
}

const ratingFormatter = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatRating(n) {
  return ratingFormatter.format(n);
}

// ISO dates ("2026-09-05") parse as UTC midnight, so format in UTC to keep the same day.
const dateFormatter = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function formatDate(iso) {
  return dateFormatter.format(new Date(iso));
}

const weekdayFormatter = new Intl.DateTimeFormat('uk-UA', { weekday: 'short', timeZone: 'UTC' });
const dayMonthFormatter = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function formatWeekday(iso) {
  return weekdayFormatter.format(new Date(iso));
}

export function formatDayMonth(iso) {
  return dayMonthFormatter.format(new Date(iso));
}

export function formatHours(day, closedLabel) {
  return day ? `${day.open}–${day.close}` : closedLabel;
}
