import { site } from '../data/site.js';

const servicesById = new Map(site.services.map((service) => [service.id, service]));
const MAX_PRICE = 100_000;

// Live prices: applyPrices swaps service.prices in place (every holder of a service object sees it) and bumps
// a version that components subscribe to (lib/livePrices.js) so they re-render.
let version = 0;
const listeners = new Set();

export const pricesVersion = () => version;

export function subscribePrices(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Takes { serviceId: { barberSlug: price } } (the "Ціни" sheet). Unknown services and barbers and prices that
 * are not positive numbers are ignored; a service left with no valid price keeps the prices from site.js.
 */
export function applyPrices(table) {
  if (!table || typeof table !== 'object') return;
  const slugs = new Set(site.team.map(({ slug }) => slug));
  let changed = false;
  site.services.forEach((service) => {
    const row = table[service.id];
    if (!row || typeof row !== 'object') return;
    const prices = {};
    Object.entries(row).forEach(([slug, value]) => {
      const price = Number(value);
      if (slugs.has(slug) && Number.isFinite(price) && price > 0 && price < MAX_PRICE) prices[slug] = Math.round(price);
    });
    if (Object.keys(prices).length === 0) return;
    service.prices = prices;
    changed = true;
  });
  if (!changed) return;
  version += 1;
  listeners.forEach((listener) => listener());
}

export function serviceById(serviceId) {
  return servicesById.get(serviceId) ?? null;
}

// Team members who offer the service, in team order.
export function barbersFor(service) {
  return site.team.map(({ slug }) => slug).filter((slug) => Object.hasOwn(service.prices, slug));
}

export function priceFor(serviceId, slug) {
  return servicesById.get(serviceId)?.prices[slug] ?? null;
}

// Sum for several services at one barber; null when the barber does not offer one of them.
export function totalPrice(services, slug) {
  let sum = 0;
  for (const service of services) {
    const price = service.prices[slug];
    if (price == null) return null;
    sum += price;
  }
  return sum;
}

// Price of a visit at the chosen barber; before one is chosen, "from" the cheapest of `candidates`.
export function visitPrice(services, barber, candidates) {
  const totals = (barber ? [barber] : candidates).map((slug) => totalPrice(services, slug)).filter((total) => total != null);
  if (services.length === 0 || totals.length === 0) return null;
  return { value: Math.min(...totals), from: !barber || services.some((service) => service.from === true) };
}

export function minPrice(service) {
  return Math.min(...Object.values(service.prices));
}

// "від" when the price depends on the barber or the listed price is only a starting point.
export function isFromPrice(service) {
  return service.from === true || new Set(Object.values(service.prices)).size > 1;
}

export function servicesFor(slug) {
  return site.services.filter((service) => Object.hasOwn(service.prices, slug));
}
