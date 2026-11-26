import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePricesVersion } from './livePrices.js';
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

/**
 * The barber and service chosen anywhere on the page (Services, Team, Works, Booking), and the open barber profile.
 * `request` counts explicit "book this" clicks, so a form showing its ticket can start a new booking.
 */
export function BookingProvider({ children }) {
  const [selection, setSelection] = useState({ barber: '', service: null, serviceReset: false });
  const [request, setRequest] = useState(0);
  const [profile, setProfile] = useState(null);

  const select = useCallback((partial) => setSelection((prev) => merge(prev, partial)), []);

  // Prices from the sheet can take the chosen service away from the chosen barber: drop it as a new barber would.
  const prices = usePricesVersion();
  useEffect(() => {
    setSelection((prev) => (prev.service && prev.barber && priceFor(prev.service, prev.barber) === null ? merge(prev, {}) : prev));
  }, [prices]);

  const openBooking = useCallback(
    (partial = {}) => {
      select(partial);
      setRequest((n) => n + 1);
      scrollToId(BOOKING_ID);
    },
    [select],
  );

  // opener: the control that opened the profile, which gets focus back when it closes (useDialog).
  const profileOpener = useRef(null);
  const openProfile = useCallback((slug, opener = null) => {
    profileOpener.current = opener;
    setProfile(slug);
  }, []);
  const closeProfile = useCallback(() => setProfile(null), []);

  const value = useMemo(
    () => ({ selection, select, request, openBooking, profile, profileOpener, openProfile, closeProfile }),
    [selection, select, request, openBooking, profile, openProfile, closeProfile],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used inside <BookingProvider>.');
  return context;
}
