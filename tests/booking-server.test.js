import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadScript } from './gas.js';

const COL = { STATUS: 1, DATE: 2, TIME: 3, BLOCKS: 4, BARBER: 5, BARBER_NAME: 6, SERVICE: 8, NAME: 9, PHONE: 10, COMMENT: 11 };
// Tomorrow relative to the fixed clock in gas.js.
const booking = (extra = {}) => ({
  name: 'Тест',
  phone: '+380671234567',
  barber: 'oleh-dok',
  service: 'haircut',
  addons: [],
  date: '2026-11-18',
  time: '12:00',
  comment: '',
  website: '',
  ...extra,
});

test('a valid booking is written with names and length worked out on the server', () => {
  const gas = loadScript();
  const answer = gas.post(booking({ addons: ['beard'], blocks: 1, barberName: 'Хтось', serviceName: '=IMPORTXML("x")' }));
  assert.deepEqual(answer, { ok: true, barber: 'oleh-dok' });
  const [row] = gas.rows();
  assert.equal(row[COL.STATUS], 'нова');
  assert.equal(row[COL.BLOCKS], '2'); // 60 + 60 min, not the client's 1
  assert.equal(row[COL.BARBER_NAME], 'Олег Док');
  assert.equal(row[COL.SERVICE], 'Стрижка + Стрижка бороди');
  assert.equal(row[COL.PHONE], '+380 67 123 45 67');
});

test('text that would run as a formula is stored as plain text', () => {
  const gas = loadScript();
  assert.equal(gas.post(booking({ name: '=HYPERLINK("http://x")', comment: '+1+2' })).ok, true);
  const [row] = gas.rows();
  assert.equal(row[COL.NAME], '\'=HYPERLINK("http://x")');
  assert.equal(row[COL.COMMENT], "'+1+2");
});

test('services, add-ons and barbers the site does not offer are rejected', () => {
  const cases = [
    [{ service: 'nope' }, 'invalid_service'],
    [{ service: '__proto__' }, 'invalid_service'],
    [{ barber: 'roman-mykhailovskyi', service: 'scissors' }, 'invalid_service'], // not on his price list
    [{ addons: ['styling'] }, 'invalid_service'], // not an add-on
    [{ addons: ['beard', 'beard'] }, 'invalid_service'],
    [{ addons: ['haircut'] }, 'invalid_service'],
    [{ barber: 'roman-mykhailovskyi', addons: ['face-care'] }, 'invalid_service'],
    [{ barber: 'nobody' }, 'invalid_barber'],
    [{ barber: 'any' }, 'invalid_barber'],
    [{ barber: 'liubov-zainchkovska', service: 'perm', addons: ['face-care', 'gray-head', 'gray-beard'] }, 'invalid_blocks'], // 5 h
  ];
  for (const [extra, error] of cases) {
    const gas = loadScript();
    assert.deepEqual(gas.post(booking(extra)), { ok: false, error }, JSON.stringify(extra));
    assert.equal(gas.rows().length, 0);
  }
});

test('names, phones, dates and times are checked', () => {
  const cases = [
    [{ name: ' ' }, 'invalid_name'],
    [{ phone: '+38067123456' }, 'invalid_phone'],
    [{ date: '2026-11-16' }, 'invalid_date'], // yesterday
    [{ date: '2026-12-31' }, 'invalid_date'], // past daysAhead
    [{ time: '12:30' }, 'invalid_time'], // off the slot grid
    [{ time: '20:00', addons: ['beard'] }, 'invalid_time'], // ends after closing
    [{ date: '2026-11-17', time: '12:00' }, 'invalid_time'], // now, inside the 60 min lead
  ];
  for (const [extra, error] of cases) assert.deepEqual(loadScript().post(booking(extra)), { ok: false, error }, JSON.stringify(extra));
  assert.deepEqual(loadScript().post('not json'), { ok: false, error: 'bad_json' });
});

test('an overlapping booking is refused, the same booking sent twice is written once', () => {
  const gas = loadScript();
  assert.equal(gas.post(booking({ service: 'perm', barber: 'liubov-zainchkovska' })).ok, true); // 12:00–14:00
  assert.deepEqual(gas.post(booking({ barber: 'liubov-zainchkovska', time: '13:00', phone: '+380501112233' })), { ok: false, error: 'slot_taken' });
  assert.equal(gas.post(booking({ service: 'perm', barber: 'liubov-zainchkovska' })).ok, true); // a retry after a lost answer
  assert.equal(gas.post(booking({ barber: 'oleh-dok', time: '13:00', phone: '+380501112233' })).ok, true); // another barber
  assert.equal(gas.rows().length, 2);
});

test('a cancelled booking frees its time', () => {
  const gas = loadScript();
  gas.post(booking());
  gas.rows()[0][COL.STATUS] = 'скасовано';
  assert.equal(gas.post(booking({ phone: '+380501112233' })).ok, true);
});

test('bookings typed in by hand ("18.11.2026", "9:00") still take their time', () => {
  const manual = ['', 'підтверджено', '18.11.2026', '9:00', '2', 'oleh-dok', 'Олег Док', '', 'Стрижка', 'Клієнт', '+380 50 111 22 33', ''];
  const gas = loadScript({ sheets: { Записи: [['header'], manual] } });
  assert.deepEqual(gas.get({ action: 'busy' }).busy, [{ date: '2026-11-18', time: '09:00', blocks: 2, barber: 'oleh-dok' }]);
  assert.deepEqual(gas.post(booking({ time: '10:00' })), { ok: false, error: 'slot_taken' });
});

test('reading busy slots does not create the bookings sheet', () => {
  const gas = loadScript();
  assert.deepEqual(gas.get({ action: 'busy' }), { ok: true, busy: [] });
  assert.equal(gas.book.has('Записи'), false);
});

test('the price sheet decides who does what, like applyPrices on the site', () => {
  const header = ['id', 'Послуга', 'oleh-dok', 'liubov-zainchkovska', 'liliia-pavlenko', 'daryna-badio', 'roman-mykhailovskyi', 'dmytro-puhach'];
  const sheets = {
    Ціни: [
      header,
      ['haircut', 'Стрижка', 950, '', 800, 650, 400, 400], // Люба stops doing it
      ['scissors', 'Стрижка ножицями', '', '', '', '', '', ''], // empty row: the starting prices stay
    ],
  };
  let gas = loadScript({ sheets });
  assert.deepEqual(gas.post(booking({ barber: 'liubov-zainchkovska' })), { ok: false, error: 'invalid_service' });
  assert.equal(loadScript({ sheets }).post(booking({ barber: 'liubov-zainchkovska', service: 'scissors' })).ok, true);
  gas = loadScript({ sheets });
  assert.deepEqual(gas.get({ action: 'prices' }).prices.haircut, { 'oleh-dok': 950, 'liliia-pavlenko': 800, 'daryna-badio': 650, 'roman-mykhailovskyi': 400, 'dmytro-puhach': 400 });
  assert.deepEqual(loadScript().get({ action: 'prices' }), { ok: false, error: 'no_prices' });
});

test('the honeypot answers ok and writes nothing', () => {
  const gas = loadScript();
  assert.deepEqual(gas.post(booking({ website: 'http://spam' })), { ok: true });
  assert.equal(gas.rows().length, 0);
});
