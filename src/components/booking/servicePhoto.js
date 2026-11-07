import { site } from '../../data/site.js';

// Thumbnail of a service for the chosen barber: their own photo, else the shared one, else another barber's.
export function servicePhoto(serviceId, barber) {
  const photos = site.images.services?.[serviceId];
  if (!photos) return null;
  return (barber && photos[barber]) || photos.all || Object.values(photos)[0] || null;
}
