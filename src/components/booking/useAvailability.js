import { useCallback, useEffect, useRef, useState } from 'react';
import { site } from '../../data/site.js';
import { fetchBusy } from '../../lib/booking.js';
import { addDaysISO, kyivNow } from '../../lib/time.js';

// state: 'loading' until the first answer, then 'ready' or 'failed'.
// On failure the last known list stays (empty at first = everything free); the server checks again.
export function useAvailability() {
  const [busy, setBusy] = useState([]);
  const [state, setState] = useState('loading');
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const id = ++requestId.current;
    const from = kyivNow().dateISO;
    try {
      const list = await fetchBusy({ from, to: addDaysISO(from, site.booking.daysAhead) });
      if (id !== requestId.current) return;
      setBusy(list);
      setState('ready');
    } catch (error) {
      if (id !== requestId.current) return;
      console.warn('[booking] could not load busy slots:', error);
      setState('failed');
    }
  }, []);

  useEffect(() => {
    refetch();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refetch]);

  const addBusy = useCallback((item) => setBusy((prev) => [...prev, item]), []);

  return { busy, state, refetch, addBusy };
}
