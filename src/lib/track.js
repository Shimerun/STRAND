export const EVENTS = Object.freeze({
  bookClick: 'book_click',
  callClick: 'call_click',
  routeClick: 'route_click',
  bookingSubmit: 'booking_submit',
  bookingSuccess: 'booking_success',
  bookingError: 'booking_error',
});

export function track(name, params = {}) {
  const payload = { event: name, ...params };
  if (typeof window !== 'undefined' && typeof window.dataLayer?.push === 'function') {
    window.dataLayer.push(payload);
  }
  if (import.meta.env.DEV) console.debug('[track]', payload);
}
