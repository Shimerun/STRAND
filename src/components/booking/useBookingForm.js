import { useEffect, useMemo, useRef, useState } from 'react';
import { site } from '../../data/site.js';
import { BookingError, submitBooking } from '../../lib/booking.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { normalizePhone } from '../../lib/phone.js';
import { barbersFor, serviceById } from '../../lib/pricing.js';
import { ANY_BARBER, blocksFor, bookingDates, freeTimes } from '../../lib/slots.js';
import { EVENTS, track } from '../../lib/track.js';
import { RULES, validate, withError } from './validation.js';

const { form } = site.ui;

const barberName = (slug) =>
  slug === ANY_BARBER ? form.anyBarber : site.team.find((barber) => barber.slug === slug)?.name ?? slug;

export function useBookingForm(availability) {
  const { selection, select } = useBooking();
  const [dates] = useState(() => bookingDates());
  const [values, setValues] = useState({ name: '', phone: '', date: dates[0] ?? '', time: '', comment: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [slotTaken, setSlotTaken] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const formRef = useRef(null);

  const { barber } = selection;
  const service = serviceById(selection.service);
  const candidates = useMemo(() => (service ? barbersFor(service) : []), [service]);
  const times = useMemo(
    () =>
      service
        ? freeTimes({ dateISO: values.date, service, barberSlug: barber, candidates, busy: availability.busy })
        : [],
    [service, barber, candidates, values.date, availability.busy],
  );
  // A time that is no longer free (refetch, another barber or service) counts as not chosen.
  const time = times.includes(values.time) ? values.time : '';

  useEffect(() => {
    if (!focusRequest) return;
    const invalid = formRef.current?.querySelector('[data-invalid="true"]');
    const target = invalid?.querySelector('input:checked') ?? invalid?.querySelector('input, select, textarea');
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
      candidates: barber === ANY_BARBER ? candidates : undefined,
      barberName: barberName(barber),
      service: service.id,
      serviceName: service.name,
      date: values.date,
      time,
      blocks: blocksFor(service),
      comment: values.comment.trim(),
      website: values.website,
    };
    const meta = { barber, service: service.id };

    track(EVENTS.bookingSubmit, meta);
    setStatus('sending');
    setSlotTaken(false);
    try {
      const result = await submitBooking(data);
      const assigned = result.barber ?? (barber === ANY_BARBER ? null : barber);
      if (assigned) availability.addBusy({ date: data.date, time, blocks: data.blocks, barber: assigned });
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
    serviceReset: selection.serviceReset,
    setField,
    chooseBarber,
    chooseService,
    submit,
  };
}
