import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { priceFor } from './pricing.js';
import { BOOKING_ID, scrollToId } from './scroll.js';

const BookingContext = createContext(null);

// Keeps the pair consistent. The latest choice wins: a new service clears a barber who does not offer it,
// a new barber clears a service they do not offer and flags `serviceReset` for the form. '' = not chosen yet.
function merge(prev, partial) {
  const next = { ...prev, ...partial, serviceReset: false };
  if (!next.service || !next.barber || priceFor(next.service, next.barber) !== null) return next;
  if ('service' in partial && !('barber' in partial)) return { ...next, barber: '' };
  return { ...next, service: null, serviceReset: true };
}

export function BookingProvider({ children }) {
  const [selection, setSelection] = useState({ barber: '', service: null, serviceReset: false });

  const select = useCallback((partial) => setSelection((prev) => merge(prev, partial)), []);

  const openBooking = useCallback(
    (partial = {}) => {
      select(partial);
      scrollToId(BOOKING_ID);
    },
    [select],
  );

  const value = useMemo(() => ({ selection, select, openBooking }), [selection, select, openBooking]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used inside <BookingProvider>.');
  return context;
}
