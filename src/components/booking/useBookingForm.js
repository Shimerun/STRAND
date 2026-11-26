import { useEffect, useMemo, useRef, useState } from 'react';
import { BookingError, submitBooking } from '../../lib/booking.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { serviceById, visitPrice } from '../../lib/pricing.js';
import { blocksFor, bookingDates, freeTimes, fullDates } from '../../lib/slots.js';
import { EVENTS, track } from '../../lib/track.js';
import { bookingRequest } from './request.js';
import { useAddons } from './useAddons.js';
import { useBarberFold, useTimeStillFree } from './useChoiceGuards.js';
import { RULES, validate, withError } from './validation.js';

const NO_DATES = new Set();

export function useBookingForm(availability) {
  const { selection, select, request } = useBooking();
  const [dates, setDates] = useState(bookingDates);
  const [values, setValues] = useState({ name: '', phone: '', date: dates[0] ?? '', time: '', addons: [], comment: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [booked, setBooked] = useState(null); // what the ticket shows, copied at submit
  const [slotTaken, setSlotTaken] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [round, setRound] = useState(0); // bookings started after a ticket
  const formRef = useRef(null);

  const { barber } = selection;
  const service = serviceById(selection.service);
  const extras = useAddons(service, barber, values.addons);
  const { durationMin } = extras;
  const ready = Boolean(service && barber);
  const { busy } = availability;
  // Times come only from a list that really loaded (busy is null until then): a failed first read proves nothing free.
  // Not memoised: each render takes the current time, so slots inside the lead time drop out of the list.
  const freeIn = (list) => (ready && list ? freeTimes({ dateISO: values.date, durationMin, barberSlug: barber, busy: list }) : []);
  const freeNow = () => freeIn(busy);
  const times = freeNow();
  // Days with nothing left are crossed out in the calendar, but only once the busy list really loaded.
  const full = useMemo(
    () => (ready && busy ? fullDates({ dates, durationMin, barberSlug: barber, busy }) : NO_DATES),
    [ready, dates, durationMin, barber, busy],
  );
  const price = visitPrice(extras.services, barber, extras.candidates);
  // A time that is no longer free (refetch, another barber or service) counts as not chosen.
  const time = times.includes(values.time) ? values.time : '';

  // A tab left open past midnight keeps yesterday in the list; refresh it (and drop a now-stale date) on return.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      const next = bookingDates();
      setDates(next);
      setValues((prev) => (next.includes(prev.date) ? prev : { ...prev, date: next[0] ?? '', time: '' }));
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

  useEffect(() => {
    if (!focusRequest) return;
    const invalid = formRef.current?.querySelector('[data-invalid="true"]');
    // data-focus-fallback: a field with nothing to pick yet (no times loaded) offers its retry instead.
    const target = invalid?.querySelector('input:checked') ?? invalid?.querySelector('input, select, textarea, [role="combobox"], [data-focus-fallback]');
    target?.focus();
  }, [focusRequest]);

  // A new booking after a ticket: name and phone stay, the visit's time and comment go.
  const again = () => {
    setValues((prev) => ({ ...prev, time: '', comment: '' }));
    setErrors({});
    setBooked(null);
    setStatus('idle');
    setRound((n) => n + 1);
  };

  // An explicit "book this" from the page (Services, a profile) while the ticket shows opens a new form with it.
  const statusRef = useRef(status);
  statusRef.current = status;
  useEffect(() => {
    if (request && statusRef.current === 'success') again();
  }, [request]);

  const [barberFolded, unfoldBarber] = useBarberFold(request, barber);

  // The form replaces the ticket: focus its first choice, as the focused "again" button is gone.
  useEffect(() => {
    if (round) formRef.current?.querySelector('input:checked, input')?.focus({ preventScroll: true });
  }, [round]);

  // Re-validates live only once a field already shows an error.
  const recheck = (key, value) => setErrors((prev) => (prev[key] ? withError(prev, key, RULES[key](value)) : prev));

  const setField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (RULES[key]) recheck(key, value);
    if (key === 'time') setSlotTaken(false);
  };

  // Barber and service live in the shared booking context.
  const choose = (key, value) => {
    select({ [key]: value });
    recheck(key, value);
  };

  const toggleAddon = (id) =>
    setValues((prev) => ({
      ...prev,
      addons: prev.addons.includes(id) ? prev.addons.filter((addon) => addon !== id) : [...prev.addons, id],
    }));

  // The chosen time is gone (booked by someone else, or now inside the lead time): ask for another one. Every other
  // choice stays. focus: false for a list refreshed in the background, which must not pull focus away.
  const timeGone = ({ focus = true } = {}) => {
    setValues((prev) => ({ ...prev, time: '' }));
    setSlotTaken(true);
    if (focus) setFocusRequest((n) => n + 1);
  };

  useTimeStillFree({ busy, time: values.time, idle: status === 'idle', freeIn, onGone: () => timeGone({ focus: false }) });

  const submit = async (event) => {
    event.preventDefault();
    if (status === 'sending') return;

    const found = validate({ ...values, time, barber, service: service?.id ?? '' });
    setErrors(found);
    if (Object.keys(found).length > 0) return setFocusRequest((n) => n + 1);
    // The form may have stayed open for a while since `times` was worked out.
    if (!freeNow().includes(time)) return timeGone();

    const { data, receipt } = bookingRequest({ values, time, barber, service, extras, price });
    const meta = { barber, service: service.id, addons: extras.addons.length };

    setStatus('sending');
    setSlotTaken(false);
    // The last refresh failed: check the time against a fresh list first (the server checks it again either way).
    if (availability.state === 'stale') {
      const fresh = await availability.refetch();
      if (fresh && !freeIn(fresh).includes(time)) {
        setStatus('idle');
        return timeGone();
      }
    }
    track(EVENTS.bookingSubmit, meta);
    try {
      await submitBooking(data);
      availability.addBusy({ date: data.date, time, blocks: blocksFor(durationMin), barber });
      void availability.refetch();
      track(EVENTS.bookingSuccess, meta);
      setBooked(receipt);
      setStatus('success');
    } catch (error) {
      const reason = error instanceof BookingError ? error.code : 'unknown';
      if (reason === 'unknown') console.error('[booking] unexpected submit error:', error);
      track(EVENTS.bookingError, { ...meta, reason });
      if (reason !== 'slot_taken' && reason !== 'invalid_time') return setStatus('error');
      setStatus('idle');
      timeGone();
      void availability.refetch();
    }
  };

  return {
    formRef,
    values,
    errors,
    status,
    booked,
    slotTaken,
    dates,
    times,
    time,
    barber,
    service,
    extras,
    full,
    price,
    serviceReset: selection.serviceReset,
    barberFolded,
    unfoldBarber,
    setField,
    chooseBarber: (slug) => choose('barber', slug),
    chooseService: (id) => choose('service', id || null),
    toggleAddon,
    submit,
    again,
  };
}
