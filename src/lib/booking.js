// The only module that knows the Google Apps Script web app (see integrations/google-sheets): bookings,
// busy slots, prices from the sheet and Google reviews.
const ENDPOINT = import.meta.env.VITE_BOOKING_ENDPOINT;
const FETCH_TIMEOUT_MS = 15_000;
// Apps Script can cold-start and then wait up to 10 s for its lock.
const SUBMIT_TIMEOUT_MS = 30_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^\d{2}:\d{2}$/;

export class BookingError extends Error {
  constructor(code) {
    super(`Booking failed: ${code}`);
    this.name = 'BookingError';
    this.code = code;
  }
}

function toErrorCode(error) {
  if (error === 'slot_taken' || error === 'busy') return error;
  if (typeof error === 'string' && error.startsWith('invalid_')) return error;
  return 'server';
}

async function request(url, init, timeoutMs) {
  let response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new BookingError('network');
  }
  if (!response.ok) throw new BookingError('server');
  let json;
  try {
    json = await response.json();
  } catch {
    throw new BookingError('server');
  }
  if (json?.ok !== true) throw new BookingError(toErrorCode(json?.error));
  return json;
}

function toBusyItem(item) {
  if (!item || !ISO_DATE.test(item.date) || !HH_MM.test(item.time) || typeof item.barber !== 'string') return null;
  return { date: item.date, time: item.time, blocks: Number(item.blocks) || 1, barber: item.barber };
}

export async function fetchBusy({ from, to }) {
  if (!ENDPOINT) return [];
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({ action: 'busy', from, to }).toString();
  const json = await request(url, { method: 'GET' }, FETCH_TIMEOUT_MS);
  return Array.isArray(json.busy) ? json.busy.map(toBusyItem).filter(Boolean) : [];
}

/** Prices from the "Ціни" sheet: { serviceId: { barberSlug: price } }, or null without an endpoint. */
export async function fetchPrices() {
  if (!ENDPOINT) return null;
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({ action: 'prices' }).toString();
  const json = await request(url, { method: 'GET' }, FETCH_TIMEOUT_MS);
  return json.prices && typeof json.prices === 'object' ? json.prices : null;
}

// Only https links from Google reach an href.
const httpsUrl = (value) => (typeof value === 'string' && value.startsWith('https://') ? value : null);
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function toReview(item) {
  const body = text(item?.text, 2000);
  const author = text(item?.author, 80);
  if (!body || !author) return null;
  return {
    author,
    authorUrl: httpsUrl(item.authorUrl),
    photo: httpsUrl(item.photo),
    rating: Math.min(Math.max(Number(item.rating) || 0, 0), 5),
    text: body,
    translated: item.translated === true,
    time: text(item.time, 40),
    url: httpsUrl(item.url),
  };
}

/** Google reviews through the web app: { rating, count, url, reviews }, or null without an endpoint. */
export async function fetchReviews() {
  if (!ENDPOINT) return null;
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({ action: 'reviews' }).toString();
  const json = await request(url, { method: 'GET' }, FETCH_TIMEOUT_MS);
  const reviews = Array.isArray(json.reviews) ? json.reviews.map(toReview).filter(Boolean) : [];
  const rating = Number(json.rating);
  if (!reviews.length || !(rating > 0)) return null;
  return { rating: Math.min(rating, 5), count: Math.max(Math.round(Number(json.count) || 0), reviews.length), url: httpsUrl(json.url), reviews };
}

export async function submitBooking(data) {
  if (!ENDPOINT) {
    if (import.meta.env.DEV) {
      console.info('[booking] VITE_BOOKING_ENDPOINT is not set — demo submit:', data);
      return { ok: true, demo: true };
    }
    throw new BookingError('not_configured');
  }
  // text/plain keeps this a "simple" request: Apps Script cannot answer a CORS preflight.
  return request(
    ENDPOINT,
    { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) },
    SUBMIT_TIMEOUT_MS,
  );
}
