import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { BOOKING_ID, scrollToId } from './scroll.js';

export const ANY_BARBER = 'any';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [selection, setSelection] = useState({ barber: ANY_BARBER, service: null });

  const select = useCallback((partial) => setSelection((prev) => ({ ...prev, ...partial })), []);

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
