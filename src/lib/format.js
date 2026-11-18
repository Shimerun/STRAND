import { site } from '../data/site.js';
import { isFromPrice, minPrice, priceFor } from './pricing.js';

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

export function formatServicePrice(service, barber) {
  return formatPrice(barber ? priceFor(service.id, barber) : minPrice(service), {
    from: barber ? service.from === true : isFromPrice(service),
  });
}

// A service's price across barbers: "400–1 000 ₴", or one price when they all charge the same.
export function formatPriceRange(prices, { from = false } = {}) {
  const values = Object.values(prices);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return formatPrice(min, { from });
  const range = `${priceFormatter.format(min)}–${priceFormatter.format(max)}${NBSP}${units.currency}`;
  return from ? `${site.ui.services.from}${NBSP}${range}` : range;
}

const ratingFormatter = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatRating(n) {
  return ratingFormatter.format(n);
}

// ISO dates ("2026-09-05") parse as UTC midnight, so format in UTC to keep the same day.
function utcDateFormat(options) {
  const formatter = new Intl.DateTimeFormat('uk-UA', { ...options, timeZone: 'UTC' });
  return (iso) => formatter.format(new Date(iso));
}

export const formatDate = utcDateFormat({ day: 'numeric', month: 'long', year: 'numeric' });
export const formatWeekday = utcDateFormat({ weekday: 'short' });
// "пт, 13 листопада"
export const formatLongDay = utcDateFormat({ weekday: 'short', day: 'numeric', month: 'long' });

const monthFormatter = new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// "Листопад 2026": the month and year only, without the "р." suffix.
export function formatMonth(iso) {
  const parts = monthFormatter.formatToParts(new Date(iso));
  const month = parts.find((part) => part.type === 'month').value;
  const year = parts.find((part) => part.type === 'year').value;
  return `${month[0].toUpperCase()}${month.slice(1)} ${year}`;
}

export function formatHours(day, closedLabel) {
  return day ? `${day.open}–${day.close}` : closedLabel;
}
