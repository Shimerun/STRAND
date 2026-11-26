import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A barber chosen outside the form (a price row, a profile: an explicit request) folds the barber list to that one
 * row, so the visitor goes on to the date without scrolling past everyone again. Returns [folded, unfold].
 */
export function useBarberFold(request, barber) {
  const [folded, setFolded] = useState(false);
  const barberRef = useRef(barber);
  barberRef.current = barber;
  useEffect(() => {
    if (request) setFolded(Boolean(barberRef.current));
  }, [request]);
  const unfold = useCallback(() => setFolded(false), []);
  return [folded && Boolean(barber), unfold];
}

/**
 * A refreshed busy list that no longer has the chosen time calls onGone (the form then clears it and says so) instead
 * of silently dropping the choice. Only for a new list while the form is idle: the visitor's own booking adds itself
 * to the list too. freeIn(list): the chosen day's free times in that list.
 */
export function useTimeStillFree({ busy, time, idle, freeIn, onGone }) {
  const latest = useRef(null);
  latest.current = { time, idle, freeIn, onGone };
  useEffect(() => {
    const { time: picked, idle: waiting, freeIn: free, onGone: gone } = latest.current;
    if (picked && waiting && !free(busy).includes(picked)) gone();
  }, [busy]);
}
