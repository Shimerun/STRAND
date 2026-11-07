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
