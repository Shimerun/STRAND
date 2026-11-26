import { site } from '../data/site.js';

// Links into the shop's EasyWeek booking, built from site.booking. booking.js decides whether bookings go there at
// all; this file only knows how far a link can carry the visitor's choice. Kept free of import.meta.env, so it is
// testable in Node and the form's code still drops out of a build that has no endpoint.

// EasyWeek's id of a service as `barber` does it, or (no barber) the one id every barber who does it shares.
function easyweekService(barber, service) {
  const ids = site.booking.externalServices ?? {};
  if (barber) return ids[barber]?.[service] ?? null;
  const offered = site.services.find(({ id }) => id === service)?.prices ?? {};
  const shared = new Set(Object.keys(offered).map((slug) => ids[slug]?.[service]));
  return shared.size === 1 ? ([...shared][0] ?? null) : null;
}

/**
 * Where EasyWeek opens for a barber (slug) and a service (id), each optional, and what the visitor still chooses
 * there: 'time' (both chosen), 'barber' (the service, for every barber alike), 'service' (the barber) or 'all'.
 */
export function easyweekLink(barber, service) {
  const { externalUrl, externalBarberUrl, externalServiceUrl, externalAnyBarberUrl } = site.booking;
  const id = site.team.find((member) => member.slug === barber)?.easyweekId;
  const variant = service ? easyweekService(id ? barber : null, service) : null;
  if (id && variant) return { url: externalServiceUrl.replace('{id}', id).replace('{service}', variant), choice: 'time' };
  if (id) return { url: externalBarberUrl.replace('{id}', id), choice: 'service' };
  if (variant) return { url: externalAnyBarberUrl.replace('{service}', variant), choice: 'barber' };
  return { url: externalUrl, choice: 'all' };
}
