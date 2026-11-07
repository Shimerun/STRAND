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

export function formatHours(day, closedLabel) {
  return day ? `${day.open}–${day.close}` : closedLabel;
}
