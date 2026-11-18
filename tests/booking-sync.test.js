// Code.gs keeps its own copy of the booking rules; this fails when it drifts from src/data/site.js.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { site } from '../src/data/site.js';
import { loadScript } from './gas.js';

const gas = loadScript();
const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

test('slot length, booking window, lead time and visit length match site.booking', () => {
  const server = gas.run('({ SLOT_MIN, DAYS_AHEAD, MIN_LEAD_MIN, MAX_BLOCKS, ADDONS })');
  const { slotMinutes, daysAhead, minLeadMinutes, maxBlocks, addons } = site.booking;
  assert.deepEqual({ ...server, ADDONS: [...server.ADDONS] }, { SLOT_MIN: slotMinutes, DAYS_AHEAD: daysAhead, MIN_LEAD_MIN: minLeadMinutes, MAX_BLOCKS: maxBlocks, ADDONS: addons });
});

test('opening hours match site.hours on every day', () => {
  const { OPEN_MIN, CLOSE_MIN } = gas.run('({ OPEN_MIN, CLOSE_MIN })');
  for (const [day, hours] of Object.entries(site.hours)) {
    assert.ok(hours, `${day}: Code.gs has no closed days`);
    assert.deepEqual([minutes(hours.open), minutes(hours.close)], [OPEN_MIN, CLOSE_MIN], day);
  }
});

test('barbers, services, durations and starting prices match site.team and site.services', () => {
  const { barbers, prices, durations } = JSON.parse(gas.run('JSON.stringify({ barbers: PRICE_BARBERS, prices: INITIAL_PRICES, durations: SERVICE_MIN })'));
  assert.deepEqual(barbers, site.team.map(({ slug, name }) => [slug, name]));
  const expected = site.services.map((service) => [service.id, service.name, ...barbers.map(([slug]) => service.prices[slug] ?? '')]);
  assert.deepEqual(prices, expected);
  assert.deepEqual(durations, Object.fromEntries(site.services.map(({ id, durationMin }) => [id, durationMin])));
});
