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
 *     Для GitHub Pages — у змінну репозиторію: Settings → Secrets and variables → Actions → Variables.
 *  6) Після ЗМІНИ цього коду: Розгорнути → Керувати розгортаннями → олівець → Нова версія.
 *
 * ЦІНИ (аркуш «Ціни»):
 *  7) Оберіть функцію setupPrices і натисніть «Виконати» — з'явиться аркуш «Ціни» з поточними цінами.
 *     Рядок = послуга, стовпчик = майстер (наведіть на заголовок — видно ім'я). Порожня клітинка = майстер
 *     цю послугу не робить. Сайт підхоплює зміни при наступному відкритті сторінки. Не змінюйте стовпчик «id»
 *     і заголовки-slug.
 *
 * ВІДГУКИ GOOGLE:
 *  8) Google Cloud Console → увімкніть «Places API (New)» → створіть ключ API (обмежте його цим API).
 *  9) Знайдіть Place ID барбершопу: https://developers.google.com/maps/documentation/places/web-service/place-id
 * 10) Apps Script → Налаштування проєкту → Властивості скрипта: PLACES_API_KEY = ключ, PLACE_ID = Place ID.
 * 11) Виконайте будь-яку функцію ще раз і дозвольте доступ до зовнішніх запитів, потім — нова версія розгортання.
 *     Без ключа сайт показує відгуки з src/data/site.js.
 *
 * ЯК ЦЕ ПРАЦЮЄ:
 *  • Нова заявка додається рядком у «Записи» зі статусом «нова».
 *  • Зайнятий час зникає з форми на сайті для цього майстра.
 *  • Скасувати запис і звільнити час: у стовпчику «Статус» оберіть «скасовано».
 *  • Не редагуйте стовпчики «Дата», «Час», «Блоків», «Майстер (slug)» вручну.
 *  • Сайт отримує лише дату, час і майстра зайнятих слотів — без імен і телефонів.
 *  • Майстра, послуги, тривалість і назви перевіряє сервер за списками нижче; сайту в цьому не віримо.
 *
 * Значення нижче мають збігатися з site.booking, site.hours, site.team і site.services у src/data/site.js
 * (перевіряє `npm test`).
 */

const SHEET_NAME = 'Записи';
const TZ = 'Europe/Kiev';
const OPEN_MIN = 10 * 60;   // початок роботи, хвилини від півночі
const CLOSE_MIN = 21 * 60;  // кінець роботи
const SLOT_MIN = 60;        // site.booking.slotMinutes
const DAYS_AHEAD = 30;      // site.booking.daysAhead
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

/* ---------- ціни ---------- */

// Стовпчики аркуша «Ціни»: id послуги, назва, далі по стовпчику на майстра (у заголовку — slug майстра,
// ім'я — у примітці до клітинки). Порожня клітинка = майстер цю послугу не виконує.
const PRICES_SHEET = 'Ціни';
const PRICE_BARBERS = [['oleh-dok', 'Олег Док'], ['liubov-zainchkovska', 'Люба Зайнчковська'], ['liliia-pavlenko', 'Лілія Павленко'], ['daryna-badio', 'Дарина Бадьо'], ['roman-mykhailovskyi', 'Роман Михайловський'], ['dmytro-puhach', 'Дмитро Пугач']];
// Стартові ціни (як у src/data/site.js); setupPrices() записує їх лише в порожній аркуш.
const INITIAL_PRICES = [
  ['haircut', 'Стрижка', 900, 1000, 800, 650, 400, 400],
  ['scissors', 'Стрижка ножицями', 1000, 1300, '', '', '', ''],
  ['clipper', 'Коротка стрижка під насадку', 800, 900, 700, 600, 350, 350],
  ['beard', 'Стрижка бороди', 800, 900, 700, 600, 350, 350],
  ['kids', 'Дитяча стрижка', 800, 1000, 700, 600, 350, 350],
  ['gray-head', 'Камуфляж сивини голови', 600, 600, 600, 600, '', ''],
  ['gray-beard', 'Камуфляж сивини бороди', 550, 550, 550, 550, '', ''],
  ['perm', 'Біозавивка', '', 3000, 3000, '', '', ''],
  ['face-care', 'Догляд за обличчям Mr.Scrubber', 600, 600, 600, 600, '', ''],
  ['scalp-care', 'Догляд за шкірою голови Nevitaly', 350, 350, 350, 350, '', 350],
  ['scalp-peeling', 'Пілінг шкіри голови Luxina', 150, 150, 150, 150, '', 150],
  ['styling', 'Укладання волосся', 150, 150, 150, 150, '', ''],
];
const MAX_PRICE = 100000;
// Тривалість у хвилинах (site.services[].durationMin) і послуги, які можна додати до візиту (site.booking.addons).
const SERVICE_MIN = { haircut: 60, scissors: 60, clipper: 60, beard: 60, kids: 60, 'gray-head': 60, 'gray-beard': 60, perm: 120, 'face-care': 60, 'scalp-care': 15, 'scalp-peeling': 15, styling: 15 };
const ADDONS = ['scalp-peeling', 'face-care', 'gray-beard', 'gray-head', 'kids', 'beard'];

// Запустіть один раз: створює аркуш «Ціни» зі стартовими цінами. Наявні ціни не перезаписує.
function setupPrices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = ss.getSheetByName(PRICES_SHEET);
  if (existing && existing.getLastRow() > 1) return;
  const sh = existing || ss.insertSheet(PRICES_SHEET);
  const header = ['id', 'Послуга'].concat(PRICE_BARBERS.map(function (b) { return b[0]; }));
  sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
  PRICE_BARBERS.forEach(function (b, i) { sh.getRange(1, i + 3).setNote(b[1]); });
  sh.getRange(2, 1, INITIAL_PRICES.length, header.length).setValues(INITIAL_PRICES);
  sh.getRange(2, 3, INITIAL_PRICES.length, PRICE_BARBERS.length).setNumberFormat('0');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
}

function prices_() {
  const prices = sheetPrices_();
  return prices ? json_({ ok: true, prices: prices }) : json_({ ok: false, error: 'no_prices' });
}

// { id послуги: { slug: ціна } } з аркуша «Ціни», або null, якщо аркуша немає.
function sheetPrices_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRICES_SHEET);
  if (!sh || sh.getLastRow() < 2) return null;
  const values = sh.getDataRange().getValues();
  const slugs = values[0].slice(2).map(function (s) { return String(s).trim(); });
  const prices = {};
  values.slice(1).forEach(function (row) {
    const id = String(row[0]).trim();
    if (!isSlug_(id)) return;
    const byBarber = {};
    slugs.forEach(function (slug, i) {
      const cell = row[i + 2];
      const price = Number(cell);
      if (isSlug_(slug) && cell !== '' && isFinite(price) && price > 0 && price < MAX_PRICE) byBarber[slug] = Math.round(price);
    });
    prices[id] = byBarber;
  });
  return prices;
}

// Що зараз можна записати: { id: { name, prices: { slug: ціна } } }. Як на сайті (src/lib/pricing.js → applyPrices):
// рядок аркуша з хоча б однією ціною відомого майстра замінює стартові ціни, інакше лишаються стартові.
function catalog_() {
  const live = sheetPrices_() || {};
  const catalog = {};
  INITIAL_PRICES.forEach(function (row) {
    const initial = {};
    const fromSheet = {};
    PRICE_BARBERS.forEach(function (b, i) {
      if (row[i + 2] !== '') initial[b[0]] = row[i + 2];
      if (has_(live, row[0]) && has_(live[row[0]], b[0])) fromSheet[b[0]] = live[row[0]][b[0]];
    });
    catalog[row[0]] = { name: row[1], prices: Object.keys(fromSheet).length ? fromSheet : initial };
  });
  return catalog;
}

/* ---------- відгуки Google ---------- */

// Відгуки беруться з Google Places API (New) щоразу наживо: правила Google забороняють кешувати відгуки.
// Ключ і Place ID — у Властивостях скрипта (Налаштування проєкту → Властивості скрипта):
//   PLACES_API_KEY — ключ API з увімкненим «Places API (New)»;
//   PLACE_ID — ідентифікатор барбершопу в Google Maps.
const PLACES_FIELDS = 'rating,userRatingCount,reviews,googleMapsUri';

function reviews_() {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty('PLACES_API_KEY');
  const placeId = props.getProperty('PLACE_ID');
  if (!key || !placeId) return json_({ ok: false, error: 'not_configured' });
  const res = UrlFetchApp.fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId) + '?languageCode=uk', {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': PLACES_FIELDS },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) return json_({ ok: false, error: 'places_' + res.getResponseCode() });
  const place = JSON.parse(res.getContentText());
  const reviews = (place.reviews || []).map(function (r) {
    const author = r.authorAttribution || {};
    const text = r.text || {};
    const original = r.originalText || {};
    return {
      author: author.displayName || '',
      authorUrl: author.uri || '',
      photo: author.photoUri || '',
      rating: r.rating || 0,
      text: text.text || '',
      translated: Boolean(original.languageCode && text.languageCode && original.languageCode !== text.languageCode),
      time: r.relativePublishTimeDescription || '',
      publishTime: r.publishTime || '',
      url: r.googleMapsUri || '',
    };
  });
  return json_({ ok: true, rating: place.rating || 0, count: place.userRatingCount || 0, url: place.googleMapsUri || '', reviews: reviews });
}

/* ---------- HTTP ---------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'busy') return busy_(p);
  if (p.action === 'prices') return prices_();
  if (p.action === 'reviews') return reviews_();
  return json_({ ok: false, error: 'bad_action' });
}

function busy_(p) {
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

    const catalog = catalog_();
    const bad = validate_(d, catalog);
    if (bad) return json_({ ok: false, error: bad });

    const phone = fmtPhone_(normPhone_(d.phone));
    const rows = readRows_().filter(function (r) { return !isCancelled_(r) && r[COL.DATE] === d.date && r[COL.BARBER] === d.barber; });
    // Та сама заявка вдруге (відповідь загубилась у мережі, людина натиснула ще раз): вона вже записана.
    if (rows.some(function (r) { return r[COL.TIME] === d.time && r[COL.PHONE] === phone; })) return json_({ ok: true, barber: d.barber });
    if (!isFree_(rows, toMin_(d.time), d.blocks)) return json_({ ok: false, error: 'slot_taken' });

    const record = {
      date: d.date,
      time: d.time,
      barber: barberName_(d.barber),
      services: d.services.map(function (id) { return catalog[id].name; }).join(' + '),
      name: text_(d.name, 60),
      phone: phone,
      comment: text_(d.comment, 300),
    };
    const sh = sheet_();
    const row = Math.max(sh.getLastRow(), 1) + 1; // row 1 is the header, even if setup() was never run
    sh.getRange(row, 1, 1, HEADERS.length).setNumberFormat('@').setValues([[
      Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'),
      STATUSES[0],
      record.date,
      record.time,
      String(d.blocks),
      d.barber,
      record.barber,
      '',
      record.services,
      record.name,
      record.phone,
      record.comment
    ]]);
    notify_(record);
    return json_({ ok: true, barber: d.barber });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- logic ---------- */

// Повертає код помилки або null. Тривалість (d.blocks) і перелік послуг (d.services) рахує сам сервер.
function validate_(d, catalog) {
  if (!d || typeof d !== 'object') return 'bad_json';
  const name = clean_(d.name, 100);
  if (name.length < 2 || name.length > 60) return 'invalid_name';
  if (!/^\+380[1-9]\d{8}$/.test(normPhone_(d.phone))) return 'invalid_phone';
  if (!isDate_(d.date)) return 'invalid_date';
  const now = nowKyiv_();
  if (d.date < now.date || d.date > addDays_(now.date, DAYS_AHEAD)) return 'invalid_date';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(d.time))) return 'invalid_time';
  if (!barberName_(d.barber)) return 'invalid_barber';
  const ids = [d.service].concat(Array.isArray(d.addons) ? d.addons : []);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (typeof id !== 'string' || !has_(catalog, id) || !has_(catalog[id].prices, d.barber)) return 'invalid_service';
    if (i > 0 && (ADDONS.indexOf(id) < 0 || ids.indexOf(id) !== i)) return 'invalid_service';
  }
  const blocks = Math.ceil(ids.reduce(function (sum, id) { return sum + SERVICE_MIN[id]; }, 0) / SLOT_MIN);
  if (!(blocks >= 1 && blocks <= MAX_BLOCKS)) return 'invalid_blocks';
  d.blocks = blocks;
  d.services = ids;
  const start = toMin_(d.time);
  if ((start - OPEN_MIN) % SLOT_MIN !== 0 || start < OPEN_MIN || start + blocks * SLOT_MIN > CLOSE_MIN) return 'invalid_time';
  if (d.date === now.date && start < now.min + MIN_LEAD_MIN) return 'invalid_time';
  return null;
}

// Чи вільний майстер з start (хвилини) на blocks слотів; rows — його записи на цей день.
function isFree_(rows, start, blocks) {
  const end = start + blocks * SLOT_MIN;
  return !rows.some(function (r) {
    const rs = toMin_(r[COL.TIME]);
    const re = rs + (Number(r[COL.BLOCKS]) || 1) * SLOT_MIN;
    return start < re && rs < end;
  });
}

function notify_(record) {
  if (!NOTIFY_EMAIL) return;
  try {
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      'Новий запис Strand: ' + record.date + ' ' + record.time,
      [record.name, record.phone, record.services, 'Майстер: ' + record.barber, record.comment].join('\n')
    );
  } catch (err) { /* лист не повинен ламати запис */ }
}

/* ---------- helpers ---------- */

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

// Рядки «Записів»; читання нічого не створює. Дату й час, внесені вручну («18.11.2026», «9:00»), зводить до
// вигляду, який пише сайт («2026-11-18», «09:00»), щоб такий запис теж займав час.
function readRows_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getDisplayValues().map(function (r) {
    r[COL.DATE] = normDate_(r[COL.DATE]);
    r[COL.TIME] = normTime_(r[COL.TIME]);
    return r;
  });
}

function normDate_(s) {
  const v = String(s).trim();
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v);
  return m ? m[3] + '-' + pad2_(m[2]) + '-' + pad2_(m[1]) : v;
}
function normTime_(s) {
  const v = String(s).trim();
  const m = /^(\d{1,2}):(\d{2})/.exec(v);
  return m ? pad2_(m[1]) + ':' + m[2] : v;
}
function pad2_(n) { return ('0' + n).slice(-2); }

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
// Текст від клієнта для клітинки: «=», «+», «-», «@» на початку Таблиця прочитала б як формулу.
function text_(v, max) { const s = clean_(v, max); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function has_(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
function barberName_(slug) {
  for (let i = 0; i < PRICE_BARBERS.length; i++) if (PRICE_BARBERS[i][0] === slug) return PRICE_BARBERS[i][1];
  return '';
}
function normPhone_(v) { return String(v == null ? '' : v).replace(/[\s()\-]/g, ''); }
function fmtPhone_(p) { return /^\+380\d{9}$/.test(p) ? p.slice(0, 4) + ' ' + p.slice(4, 6) + ' ' + p.slice(6, 9) + ' ' + p.slice(9, 11) + ' ' + p.slice(11) : p; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
