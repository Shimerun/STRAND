# Stage 2 — About, services, team

- **About**: two columns on desktop (text left, `site.images.about` with photo reveal right), one column on mobile. Text from `site.about`. Below it a row of chips from `site.amenities`.
- **`src/lib/pricing.js`**: `priceFor(serviceId, slug)`, `minPrice(service)`, `servicesFor(slug)`. Never hardcode prices in components.
- **`src/lib/bookingContext.jsx`**: `BookingProvider` (wraps `App`) with `selection {barber, service}` (`barber` is a slug or `'any'`, default `'any'`; `service` an id or `null`), `select(partial)` and `openBooking(partial)` = `select(partial)` + `scrollToId('booking')` (the Booking section arrives in Stage 4; a missing element is a no-op). Services and Team only call `openBooking`; the form (Stage 4) reads `selection`.
- **Services**: grid of cards: name, short description, duration (`formatDuration(durationMin)`), price `formatPrice(minPrice(service), {from})` where "від" shows when the service has several different prices OR `from: true`, `note` as a small line under the description when present, button "Записатись" → `openBooking({service: id})`. Note under the grid: `ui.services.priceNote`.
- **Team**: card per barber (photo `/images/team/<slug>.jpg`, name, role, rating if set, Instagram icon only if `instagram` is set). Juniors (`junior: true`) show their role as a small outlined chip. Horizontal scroll-snap on mobile, grid on desktop.
- **Price drawer**: clicking a barber card opens a bottom sheet on mobile, side panel on desktop, with that barber's price list via `servicesFor(slug)`: service, duration, price, `note`. Button "Записатись до майстра" closes the drawer and calls `openBooking({barber: slug})`. Close with Esc, backdrop click or swipe down. Focus trap. z-index 60. Stop Lenis while open.

Missing content to mention: `about.jpg`, `team/<slug>.jpg` photos, Instagram links.
