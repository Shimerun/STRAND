import { useEffect, useSyncExternalStore } from 'react';
import { fetchPrices } from './booking.js';
import { applyPrices, pricesVersion, subscribePrices } from './pricing.js';

const CACHE_KEY = 'strand:prices';

/** Re-renders the caller whenever live prices arrive; returns their version (use it in memo deps). */
export function usePricesVersion() {
  return useSyncExternalStore(subscribePrices, pricesVersion);
}

// Storage may be blocked (private mode, site data off): prices then simply come from the sheet each time.
function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function writeCache(table) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(table));
  } catch {
    // Not remembered; the next visit loads them from the sheet again.
  }
}

/**
 * Prices from the Google Sheet: the copy this browser saw last is applied at once, then the fresh ones.
 * Without an endpoint or when the sheet cannot be reached, the prices from site.js stay.
 */
export function useLivePrices() {
  useEffect(() => {
    applyPrices(readCache());
    let alive = true;
    fetchPrices()
      .then((table) => {
        if (!alive || !table) return;
        applyPrices(table);
        writeCache(table);
      })
      .catch((error) => console.warn('[prices] could not load prices from the sheet:', error));
    return () => {
      alive = false;
    };
  }, []);
  return usePricesVersion();
}
