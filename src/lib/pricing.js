import { site } from '../data/site.js';

const servicesById = new Map(site.services.map((service) => [service.id, service]));

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
