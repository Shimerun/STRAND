// The only module that knows where bookings go: a Google Apps Script web app (see integrations/google-sheets).
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
