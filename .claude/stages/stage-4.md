# Stage 4 — Booking (Google Sheets), contacts, footer

Bookings are written to a Google Sheet by the Apps Script in `integrations/google-sheets/Code.gs` (already in the kit, do not rewrite it). The sheet is the source of truth for taken slots. Strings come from `site.ui.form`.

## `src/lib/slots.js` (pure, no React)
- `blocksFor(service)` = `Math.ceil(service.durationMin / booking.slotMinutes)`. A booking occupies whole slots (a 15-minute service still blocks its slot; a 2-hour service blocks two).
- `freeTimes({ dateISO, service, barberSlug, candidates, busy, now = kyivNow() })` → array of `"HH:MM"`:
  - `day = site.hours[weekdayOf(dateISO)]`; `null` → `[]`.
  - Starts: `open`, `open + slot`, … while `start + blocks*slot <= close` (so a 2-hour service starts at 19:00 at the latest when closing is 21:00).
  - If `dateISO` is today in Kyiv time, drop starts earlier than `now.minutes + booking.minLeadMinutes`.
  - `busy` items are `{date, time, blocks, barber}`; an item occupies `[toMinutes(time), toMinutes(time) + blocks*slot)`. A barber is free at a start when no item for them overlaps `[start, start + blocks*slot)`.
  - `barberSlug === 'any'`: a start is free if ANY slug in `candidates` (barbers who offer the service, from `servicesFor`) is free. Otherwise only that barber.

## `src/lib/booking.js` (the only place that talks to the endpoint)
- `fetchBusy({from, to})`: `GET ${VITE_BOOKING_ENDPOINT}?action=busy&from=YYYY-MM-DD&to=YYYY-MM-DD` → `json.busy`. Endpoint unset → `[]`.
- `submitBooking(data)` with `data = { name, phone, barber, candidates, barberName, service, serviceName, date, time, blocks, comment, website }` (`barber` is a slug or `'any'`; `candidates` only for `'any'`; `website` is the honeypot, always empty for real users). `fetch(endpoint, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(data) })` (text/plain avoids a CORS preflight, which Apps Script cannot answer). Response `{ok:true}` resolves. `{ok:false, error}` and network errors throw `BookingError(code)`. Codes: `slot_taken`, `invalid_*`, `busy`, `server`, `network`, `not_configured`.
- Endpoint unset: in DEV `console.info` the payload and resolve (demo); in a production build throw `BookingError('not_configured')`. Never a fake success in production.
- Add `.env.example` entries if missing. Do not build a backend.

## `src/components/booking/` (folder, every file under 150 lines)
`Booking.jsx` (section, `id="booking"`, `data-scissors-end`), `BookingForm.jsx`, `useBookingForm.js` (state and validation), `useAvailability.js`, `fields/` (`NameField`, `PhoneField`, `DateField`, `SlotPicker`, `PriceLine`), `SuccessState.jsx`, `ErrorState.jsx`. State of barber and service is shared with Services and Team through `bookingContext` (`selection`).

### Fields
All required except the comment. **Name and phone are mandatory**: `required`, `aria-required`, an inline Ukrainian message under the field, `aria-invalid`, and on submit focus moves to the first invalid field. Never send a request with an empty name or phone.
- Name: trimmed, 2 to 60 characters.
- Phone: `type="tel" inputMode="tel" autoComplete="tel"`, mask `+380 XX XXX XX XX` (accept `0671234567`, `380671234567` or `+380…` and normalise; the prefix is fixed). Valid when the digits match `^\+380[1-9]\d{8}$`. Send it normalised without spaces.
- Barber select: team plus `ui.form.anyBarber` (value `any`). Service select: `servicesFor(slug)` for a barber, all services for `any`. If the barber changes and the chosen service is not offered, clear the service and show `ui.form.serviceReset`.
- Price line under the selects: exact `priceFor` for a chosen pair; `"від " + minPrice` for `any`; "від" also for `from: true`. Show `service.note` below it when present.
- Date: next `booking.daysAhead` days (Kyiv date), closed days skipped.
- Time: render ONLY free times from `freeTimes`. A taken slot is not shown. Empty result → `ui.form.slots.none`. While busy data loads → `slots.loading`. Without barber or service → `slots.pickService`. If the chosen time disappears after a refetch, clear it.
- Comment (optional, ≤ 300 chars). Honeypot `website`: visually hidden, `tabIndex=-1`, `autoComplete="off"`, `aria-hidden`.
- `ui.form.consent` under the button.

### Availability
`useAvailability`: `fetchBusy` for today … today + `daysAhead` on mount; refetch on `visibilitychange` (tab visible again) and after `slot_taken` or success; after success also add the booked slot to the local list. If the fetch fails, show `slots.loadFailed` and treat everything as free (the server checks again).

### States
Loading on the button (`ui.form.sending`). `slot_taken` → `slots.taken`, refetch, clear time. Success → `ui.form.success`. Other errors → `ui.form.errorText` plus the clickable phone. `aria-live="polite"` for statuses. Call `track` with `booking_submit`, `booking_success`, `booking_error` (`{reason}`).

## Contacts
Address, clickable phone, hours table built from `site.hours` with `formatHours` and today highlighted (`ui.contacts`), Google Maps embed `https://www.google.com/maps?q=LAT,LNG&output=embed` with `loading="lazy"`, button "Маршрут" → `https://www.google.com/maps/search/?api=1&query=LAT,LNG` (`track route_click`).

## Footer
Logo, phone, address, Instagram if set, `© ${new Date().getFullYear()} ${site.name}`.

## Mobile sticky bar
"Записатись" and "Подзвонити", z-index 45, `padding-bottom: env(safe-area-inset-bottom)`, hidden while `#booking` is on screen (IntersectionObserver).

## Finish
`npm run build` once, update Progress, commit. Then tell me, in Ukrainian, in 5 short lines, to set up the sheet: the steps are in the header comment of `integrations/google-sheets/Code.gs`; the resulting URL goes into `.env` as `VITE_BOOKING_ENDPOINT`. Remind me that I cancel a booking by typing `скасовано` in the "Статус" column, which frees the slot.

Missing content to mention: the Apps Script URL in `.env`.
