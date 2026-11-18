import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookingRequest } from '../src/components/booking/request.js';
import { RULES } from '../src/components/booking/validation.js';
import { formatPhone, isValidPhone, normalizePhone } from '../src/lib/phone.js';
import { blocksFor, bookingDates, freeTimes } from '../src/lib/slots.js';

test('phone numbers in the usual Ukrainian spellings normalise to +380XXXXXXXXX', () => {
  const cases = {
    '0671234567': '+380671234567',
    '067 123-45-67': '+380671234567',
    '+38 (067) 123 45 67': '+380671234567',
    '380671234567': '+380671234567',
    '80671234567': '+380671234567', // the old "8 0XX" habit
    '+380 80671234567': '+380671234567', // the same, typed after the fixed prefix
    '0800123456': '+380800123456', // toll-free stays
    '+380 800 123 456': '+380800123456',
  };
  for (const [raw, normalised] of Object.entries(cases)) assert.equal(normalizePhone(raw), normalised, raw);
  assert.equal(formatPhone('80671234567'), '+380 67 123 45 67');
  assert.equal(normalizePhone('+380 '), '');
  assert.equal(isValidPhone(normalizePhone('067123')), false);
});

test('phone rule: empty, short and valid numbers', () => {
  assert.ok(RULES.phone('+380 '));
  assert.ok(RULES.phone('+380 67 123'));
  assert.equal(RULES.phone('+380 67 123 45 67'), null);
});

test('free times: lead time, closing time and the barber\'s own visits', () => {
  const now = { dateISO: '2026-11-17', minutes: 12 * 60 + 10 };
  const busy = [
    { date: '2026-11-17', time: '15:00', blocks: 2, barber: 'oleh-dok' },
    { date: '2026-11-17', time: '14:00', blocks: 1, barber: 'liliia-pavlenko' },
  ];
  // 12:10 now + 60 min lead → 14:00 first; 15:00–17:00 taken; a 2-hour visit must end by 21:00.
  assert.deepEqual(freeTimes({ dateISO: '2026-11-17', durationMin: 120, barberSlug: 'oleh-dok', busy, now }), ['17:00', '18:00', '19:00']);
  assert.deepEqual(freeTimes({ dateISO: '2026-11-17', durationMin: 60, barberSlug: 'oleh-dok', busy, now }), ['14:00', '17:00', '18:00', '19:00', '20:00']);
  assert.deepEqual(freeTimes({ dateISO: '2026-11-16', durationMin: 60, barberSlug: 'oleh-dok', busy, now }), []); // yesterday
  assert.equal(freeTimes({ dateISO: '2026-11-18', durationMin: 15, barberSlug: 'oleh-dok', busy, now }).length, 11);
  assert.equal(blocksFor(75), 2);
});

test('booking dates start tomorrow once today has no slot left', () => {
  const morning = bookingDates({ dateISO: '2026-11-17', minutes: 9 * 60 });
  assert.equal(morning[0], '2026-11-17');
  assert.equal(morning.length, 30);
  const evening = bookingDates({ dateISO: '2026-11-17', minutes: 19 * 60 + 5 }); // 20:00 is inside the 60 min lead
  assert.equal(evening[0], '2026-11-18');
  assert.equal(evening.at(-1), '2026-12-16'); // the server takes up to today + 30
});

test('the request carries ids only; the ticket keeps its own copy', () => {
  const service = { id: 'haircut', name: 'Стрижка' };
  const addon = { id: 'beard', name: 'Стрижка бороди' };
  const extras = { addons: [addon], services: [service, addon] };
  const values = { name: '  Тест ', phone: '067 123 45 67', date: '2026-11-18', comment: ' ', website: '' };
  const price = { value: 1700, from: false };
  const { data, receipt } = bookingRequest({ values, time: '12:00', barber: 'oleh-dok', service, extras, price });
  assert.deepEqual(data, { name: 'Тест', phone: '+380671234567', barber: 'oleh-dok', service: 'haircut', addons: ['beard'], date: '2026-11-18', time: '12:00', comment: '', website: '' });
  assert.deepEqual(receipt, { date: '2026-11-18', time: '12:00', barber: 'Олег Док', services: 'Стрижка, Стрижка бороди', price });
});
