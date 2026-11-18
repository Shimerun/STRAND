import { site } from '../../data/site.js';
import { normalizePhone } from '../../lib/phone.js';

/**
 * What goes to the sheet, ids only (it works out names, prices and the length itself), and the ticket's copy of
 * the visit, taken at submit so picks elsewhere on the page or live prices cannot change it afterwards.
 */
export function bookingRequest({ values, time, barber, service, extras, price }) {
  return {
    data: {
      name: values.name.trim(),
      phone: normalizePhone(values.phone),
      barber,
      service: service.id,
      addons: extras.addons.map(({ id }) => id),
      date: values.date,
      time,
      comment: values.comment.trim(),
      website: values.website,
    },
    receipt: {
      date: values.date,
      time,
      barber: site.team.find(({ slug }) => slug === barber)?.name ?? '',
      services: extras.services.map(({ name }) => name).join(', '),
      price,
    },
  };
}
