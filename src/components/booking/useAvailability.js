import { useCallback, useEffect, useRef, useState } from 'react';
import { site } from '../../data/site.js';
import { fetchBusy } from '../../lib/booking.js';
import { addDaysISO, kyivNow } from '../../lib/time.js';

/**
 * Busy slots from the sheet. state: 'loading' (no answer yet, or the visitor's own retry), 'ready', 'failed' (no
 * list has ever loaded: no time can be offered) or 'stale' (a refresh failed; `busy` is the last list that loaded,
 * and the server checks the time again on submit). busy: null until the first list loads.
 * refetch() resolves to the new list, or null when it failed or a newer request overtook it.
 */
export function useAvailability() {
  const [busy, setBusy] = useState(null);
  const [state, setState] = useState('loading');
  const requestId = useRef(0);
  const loaded = useRef(false);

  const refetch = useCallback(async () => {
    const id = ++requestId.current;
    const from = kyivNow().dateISO;
    try {
      const list = await fetchBusy({ from, to: addDaysISO(from, site.booking.daysAhead) });
      // An answer to an older request never overwrites a newer one.
      if (id !== requestId.current) return null;
      loaded.current = true;
      setBusy(list);
      setState('ready');
      return list;
    } catch (error) {
      if (id !== requestId.current) return null;
      console.warn('[booking] could not load busy slots:', error);
      setState(loaded.current ? 'stale' : 'failed');
      return null;
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

  const addBusy = useCallback((item) => setBusy((prev) => [...(prev ?? []), item]), []);
  // The visitor's own "check again": shows the loading state, unlike the quiet refetch after a booking.
  const retry = useCallback(() => {
    setState('loading');
    return refetch();
  }, [refetch]);

  return { busy, state, refetch, retry, addBusy };
}
