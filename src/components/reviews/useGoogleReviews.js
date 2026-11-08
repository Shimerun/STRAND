import { useEffect, useState } from 'react';
import { fetchReviews } from '../../lib/booking.js';

const AHEAD = '600px 0px'; // start loading a little before the section scrolls in

/**
 * Google reviews for the section `ref` points at, fetched once when it comes near the screen (every fetch is
 * a paid Places API call, and Google does not allow caching reviews). null until then, or when unavailable.
 */
export function useGoogleReviews(ref) {
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let alive = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        fetchReviews()
          .then((result) => {
            if (alive && result) setReviews(result);
          })
          .catch((error) => console.warn('[reviews] could not load Google reviews:', error));
      },
      { rootMargin: AHEAD },
    );
    observer.observe(element);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [ref]);

  return reviews;
}
