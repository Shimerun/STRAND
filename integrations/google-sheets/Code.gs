/**
 * STRAND — запис клієнтів у Google Таблицю (Google Apps Script, веб-застосунок).
 *
 * НАЛАШТУВАННЯ (один раз, ~5 хвилин):
 *  1) Створіть нову Google Таблицю (назва, наприклад, «Strand — записи»).
 *  2) Розширення → Apps Script. Видаліть усе, вставте цей файл, збережіть.
 *  3) У списку функцій оберіть setup і натисніть «Виконати». Дозвольте доступ.
 *     З'явиться аркуш «Записи» із заголовками та випадаючим списком у стовпчику «Статус».
 *  4) Розгорнути → Нове розгортання → тип «Веб-застосунок»:
 *       Виконувати від імені: Я
 *       Доступ: Усі
 *     Скопіюйте URL, що закінчується на /exec.
 *  5) Вставте цей URL у файл .env сайту: VITE_BOOKING_ENDPOINT=https://script.google.com/macros/s/…/exec
 *  6) Після ЗМІНИ цього коду: Розгорнути → Керувати розгортаннями → олівець → Нова версія.
 *
 * ЯК ЦЕ ПРАЦЮЄ:
 *  • Нова заявка додається рядком у «Записи» зі статусом «нова».
 *  • Зайнятий час зникає з форми на сайті для цього майстра.
 *  • Скасувати запис і звільнити час: у стовпчику «Статус» оберіть «скасовано».
 *  • Не редагуйте стовпчики «Дата», «Час», «Блоків», «Майстер (slug)» вручну.
 *  • Сайт отримує лише дату, час і майстра зайнятих слотів — без імен і телефонів.
 *
 * Значення нижче мають збігатися з site.booking та site.hours у src/data/site.js.
 */

const SHEET_NAME = 'Записи';
const TZ = 'Europe/Kiev';
const OPEN_MIN = 10 * 60;   // початок роботи, хвилини від півночі
const CLOSE_MIN = 21 * 60;  // кінець роботи
const SLOT_MIN = 60;        // site.booking.slotMinutes
const DAYS_AHEAD = 14;      // site.booking.daysAhead
const MIN_LEAD_MIN = 60;    // site.booking.minLeadMinutes
const MAX_BLOCKS = 4;
const NOTIFY_EMAIL = '';    // вкажіть пошту, щоб отримувати лист про кожну заявку; порожньо = без листів
const CANCELLED = 'скасовано';
const STATUSES = ['нова', 'підтверджено', 'скасовано', 'прийшов'];

const HEADERS = ['Створено', 'Статус', 'Дата', 'Час', 'Блоків', 'Майстер (slug)', 'Майстер', 'Будь-який майстер', 'Послуга', "Ім'я", 'Телефон', 'Коментар'];
const COL = { CREATED: 0, STATUS: 1, DATE: 2, TIME: 3, BLOCKS: 4, BARBER: 5, BARBER_NAME: 6, ANY: 7, SERVICE: 8, NAME: 9, PHONE: 10, COMMENT: 11 };

/* ---------- setup ---------- */

function setup() {
  const sh = sheet_();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  const rows = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, 1, rows, HEADERS.length).setNumberFormat('@'); // текстовий формат: дати, час і «+380…» не перетворюються
  sh.getRange(2, COL.STATUS + 1, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(true).build()
  );
}

/* ---------- HTTP ---------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'busy') return json_({ ok: false, error: 'bad_action' });
  const today = nowKyiv_().date;
  const from = isDate_(p.from) ? p.from : today;
  const to = isDate_(p.to) ? p.to : addDays_(today, DAYS_AHEAD);
  const busy = readRows_()
    .filter(function (r) { return !isCancelled_(r) && r[COL.DATE] >= from && r[COL.DATE] <= to; })
    .map(function (r) {
      return { date: r[COL.DATE], time: r[COL.TIME], blocks: Number(r[COL.BLOCKS]) || 1, barber: r[COL.BARBER] };
    });
  return json_({ ok: true, busy: busy });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, error: 'busy' });
  try {
    let d;
    try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_json' }); }
    if (d && d.website) return json_({ ok: true }); // honeypot: тихо ігноруємо ботів

    const bad = validate_(d);
    if (bad) return json_({ ok: false, error: bad });

    const rows = readRows_().filter(function (r) { return !isCancelled_(r) && r[COL.DATE] === d.date; });
    const barber = pickBarber_(rows, d, toMin_(d.time));
    if (!barber) return json_({ ok: false, error: 'slot_taken' });

    const sh = sheet_();
    const row = sh.getLastRow() + 1;
    sh.getRange(row, 1, 1, HEADERS.length).setNumberFormat('@').setValues([[
      Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'),
      STATUSES[0],
      d.date,
      d.time,
      String(d.blocks),
      barber,
      d.barber === 'any' ? 'будь-який' : clean_(d.barberName, 80),
      d.barber === 'any' ? 'так' : '',
      clean_(d.serviceName, 120) || d.service,
      clean_(d.name, 60),
      fmtPhone_(normPhone_(d.phone)),
      clean_(d.comment, 300)
    ]]);
    notify_(d, barber);
    return json_({ ok: true, barber: barber });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- logic ---------- */

function validate_(d) {
  if (!d || typeof d !== 'object') return 'bad_json';
  const name = clean_(d.name, 100);
  if (name.length < 2 || name.length > 60) return 'invalid_name';
  if (!/^\+380[1-9]\d{8}$/.test(normPhone_(d.phone))) return 'invalid_phone';
  if (!isDate_(d.date)) return 'invalid_date';
  const now = nowKyiv_();
  if (d.date < now.date || d.date > addDays_(now.date, DAYS_AHEAD)) return 'invalid_date';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(d.time))) return 'invalid_time';
  const blocks = Number(d.blocks);
  if (!Number.isInteger(blocks) || blocks < 1 || blocks > MAX_BLOCKS) return 'invalid_blocks';
  d.blocks = blocks;
  const start = toMin_(d.time);
  if ((start - OPEN_MIN) % SLOT_MIN !== 0 || start < OPEN_MIN || start + blocks * SLOT_MIN > CLOSE_MIN) return 'invalid_time';
  if (d.date === now.date && start < now.min + MIN_LEAD_MIN) return 'invalid_time';
  if (d.barber === 'any') {
    if (!Array.isArray(d.candidates) || d.candidates.length < 1 || d.candidates.length > 12) return 'invalid_barber';
    for (let i = 0; i < d.candidates.length; i++) if (!isSlug_(d.candidates[i])) return 'invalid_barber';
  } else if (!isSlug_(d.barber)) {
    return 'invalid_barber';
  }
  if (!isSlug_(d.service)) return 'invalid_service';
  return null;
}

// Повертає slug вільного майстра або null. Для «any» обирає найменш завантаженого за цей день.
function pickBarber_(rows, d, start) {
  const end = start + d.blocks * SLOT_MIN;
  const isFree = function (slug) {
    return !rows.some(function (r) {
      if (r[COL.BARBER] !== slug) return false;
      const rs = toMin_(r[COL.TIME]);
      const re = rs + (Number(r[COL.BLOCKS]) || 1) * SLOT_MIN;
      return start < re && rs < end;
    });
  };
  if (d.barber !== 'any') return isFree(d.barber) ? d.barber : null;
  const free = d.candidates.filter(isFree);
  if (!free.length) return null;
  const load = function (slug) { return rows.filter(function (r) { return r[COL.BARBER] === slug; }).length; };
  free.sort(function (a, b) { return load(a) - load(b); });
  return free[0];
}

function notify_(d, barber) {
  if (!NOTIFY_EMAIL) return;
  try {
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      'Новий запис Strand: ' + d.date + ' ' + d.time,
      [clean_(d.name, 60), fmtPhone_(normPhone_(d.phone)), clean_(d.serviceName, 120), 'Майстер: ' + barber, clean_(d.comment, 300)].join('\n')
    );
  } catch (err) { /* лист не повинен ламати запис */ }
}

/* ---------- helpers ---------- */

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function readRows_() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, HEADERS.length).getDisplayValues();
}

function isCancelled_(r) { return String(r[COL.STATUS]).trim().toLowerCase() === CANCELLED; }
function isSlug_(s) { return typeof s === 'string' && /^[a-z0-9-]{1,40}$/.test(s); }
function isDate_(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = new Date(s + 'T00:00:00Z');
  return !isNaN(t.getTime()) && t.toISOString().slice(0, 10) === s;
}
function toMin_(hhmm) { const p = String(hhmm).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
function addDays_(iso, n) { const t = new Date(iso + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
function nowKyiv_() {
  const s = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
  return { date: s.slice(0, 10), min: toMin_(s.slice(11)) };
}
function clean_(v, max) { return String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max); }
function normPhone_(v) { return String(v == null ? '' : v).replace(/[\s()\-]/g, ''); }
function fmtPhone_(p) { return /^\+380\d{9}$/.test(p) ? p.slice(0, 4) + ' ' + p.slice(4, 6) + ' ' + p.slice(6, 9) + ' ' + p.slice(9, 11) + ' ' + p.slice(11) : p; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
