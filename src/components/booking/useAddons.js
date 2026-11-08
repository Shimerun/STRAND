import { useMemo } from 'react';
import { site } from '../../data/site.js';
import { usePricesVersion } from '../../lib/livePrices.js';
import { barbersFor, serviceById } from '../../lib/pricing.js';
import { blocksFor } from '../../lib/slots.js';

const ADDONS = site.booking.addons.map(serviceById).filter(Boolean);
const offers = (service, slug) => Object.hasOwn(service.prices, slug);
const totalMinutes = (services) => services.reduce((sum, service) => sum + service.durationMin, 0);

// True when adding `addon` would make the visit longer than the sheet accepts (site.booking.maxBlocks).
export const tooLong = (services, addon) => blocksFor(totalMinutes([...services, addon])) > site.booking.maxBlocks;

const NONE = { options: [], addons: [], services: [], candidates: [], durationMin: 0 };

/**
 * Extras for the main `service`: the ones the chosen barber (or, before one is chosen, anyone who does
 * `service`) offers, which of the checked `ids` still apply, every service of the visit, the barbers who
 * can do all of them, and the total length in minutes. Checked extras that no longer fit are dropped in list order.
 */
export function useAddons(service, barber, ids) {
  const prices = usePricesVersion(); // who offers what can change when prices arrive from the sheet
  return useMemo(() => {
    if (!service) return NONE;
    const offered = barbersFor(service);
    const pool = barber ? [barber] : offered;
    const options = ADDONS.filter((addon) => addon.id !== service.id && pool.some((slug) => offers(addon, slug)));

    const addons = [];
    for (const addon of options) {
      if (ids.includes(addon.id) && !tooLong([service, ...addons], addon)) addons.push(addon);
    }
    const services = [service, ...addons];
    const candidates = offered.filter((slug) => addons.every((addon) => offers(addon, slug)));
    return { options, addons, services, candidates, durationMin: totalMinutes(services) };
  }, [service, barber, ids, prices]);
}
