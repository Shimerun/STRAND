import { useEffect, useMemo, useRef, useState } from 'react';
import { site } from '../../data/site.js';
import { BookingError, submitBooking } from '../../lib/booking.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { normalizePhone } from '../../lib/phone.js';
import { serviceById, visitPrice } from '../../lib/pricing.js';
import { blocksFor, bookingDates, freeTimes, fullDates } from '../../lib/slots.js';
import { EVENTS, track } from '../../lib/track.js';
import { useAddons } from './useAddons.js';
import { RULES, validate, withError } from './validation.js';

const barberName = (slug) => site.team.find((barber) => barber.slug === slug)?.name ?? slug;
const NO_DATES = new Set();

export function useBookingForm(availability) {
  const { selection, select } = useBooking();
  const [dates] = useState(() => bookingDates());
  const [values, setValues] = useState({ name: '', phone: '', date: dates[0] ?? '', time: '', addons: [], comment: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [slotTaken, setSlotTaken] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const formRef = useRef(null);

  const { barber } = selection;
  const service = serviceById(selection.service);
  const extras = useAddons(service, barber, values.addons);
  const { durationMin } = extras;
  const ready = Boolean(service && barber);
  const { busy } = availability;
  const times = useMemo(
    () => (ready ? freeTimes({ dateISO: values.date, durationMin, barberSlug: barber, busy }) : []),
    [ready, durationMin, barber, values.date, busy],
  );
  // Days with nothing left are crossed out in the calendar, but only once the busy list really loaded.
  const full = useMemo(
    () => (ready && availability.state === 'ready' ? fullDates({ dates, durationMin, barberSlug: barber, busy }) : NO_DATES),
    [ready, availability.state, dates, durationMin, barber, busy],
  );
  const price = visitPrice(extras.services, barber, extras.candidates);
  // A time that is no longer free (refetch, another barber or service) counts as not chosen.
  const time = times.includes(values.time) ? values.time : '';

  useEffect(() => {
    if (!focusRequest) return;
    const invalid = formRef.current?.querySelector('[data-invalid="true"]');
    const target = invalid?.querySelector('input:checked') ?? invalid?.querySelector('input, select, textarea, [role="combobox"]');
    target?.focus();
  }, [focusRequest]);

  // Re-validates live only once a field already shows an error.
  const recheck = (key, value) => setErrors((prev) => (prev[key] ? withError(prev, key, RULES[key](value)) : prev));

  const setField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (RULES[key]) recheck(key, value);
    if (key === 'time') setSlotTaken(false);
  };

  const chooseBarber = (slug) => {
    select({ barber: slug });
    recheck('barber', slug);
  };

  const toggleAddon = (id) =>
    setValues((prev) => ({
      ...prev,
      addons: prev.addons.includes(id) ? prev.addons.filter((addon) => addon !== id) : [...prev.addons, id],
    }));

  const chooseService = (id) => {
    select({ service: id || null });
    recheck('service', id);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (status === 'sending') return;

    const found = validate({ ...values, time, barber, service: service?.id ?? '' });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFocusRequest((n) => n + 1);
      return;
    }

    const data = {
      name: values.name.trim(),
      phone: normalizePhone(values.phone),
      barber,
      barberName: barberName(barber),
      service: service.id,
      serviceName: extras.services.map(({ name }) => name).join(' + '),
      addons: extras.addons.map(({ id }) => id),
      date: values.date,
      time,
      blocks: blocksFor(durationMin),
      comment: values.comment.trim(),
      website: values.website,
    };
    const meta = { barber, service: service.id, addons: extras.addons.length };

    track(EVENTS.bookingSubmit, meta);
    setStatus('sending');
    setSlotTaken(false);
    try {
      await submitBooking(data);
      availability.addBusy({ date: data.date, time, blocks: data.blocks, barber });
      void availability.refetch();
      track(EVENTS.bookingSuccess, meta);
      setStatus('success');
    } catch (error) {
      const reason = error instanceof BookingError ? error.code : 'unknown';
      if (reason === 'unknown') console.error('[booking] unexpected submit error:', error);
      track(EVENTS.bookingError, { ...meta, reason });
      if (reason !== 'slot_taken') {
        setStatus('error');
        return;
      }
      setValues((prev) => ({ ...prev, time: '' }));
      setSlotTaken(true);
      setStatus('idle');
      void availability.refetch();
    }
  };

  return {
    formRef,
    values,
    errors,
    status,
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
    setField,
    chooseBarber,
    chooseService,
    toggleAddon,
    submit,
  };
}
