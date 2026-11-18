// Runs integrations/google-sheets/Code.gs in a Node sandbox: an in-memory spreadsheet, a fixed clock and stubs
// for the Apps Script services it touches. No network, no real sheet.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SOURCE = readFileSync(new URL('../integrations/google-sheets/Code.gs', import.meta.url), 'utf8');
// 2026-11-17 12:00 in Kyiv (UTC+2 in winter).
export const NOW = Date.parse('2026-11-17T10:00:00Z');

class Sheet {
  constructor(name) {
    this.name = name;
    this.rows = [];
  }
  getLastRow() {
    return this.rows.length;
  }
  getMaxRows() {
    return 1000;
  }
  getRange(row, col, rows = 1, cols = 1) {
    const sheet = this;
    const cells = () => Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => sheet.rows[row - 1 + i]?.[col - 1 + j] ?? ''));
    const range = {
      setValues(values) {
        values.forEach((line, i) => {
          const target = (sheet.rows[row - 1 + i] ??= []);
          line.forEach((value, j) => (target[col - 1 + j] = value));
        });
        return range;
      },
      getValues: cells,
      // Sheets hides the apostrophe that forces text.
      getDisplayValues: () => cells().map((line) => line.map((value) => String(value).replace(/^'/, ''))),
      setNumberFormat: () => range,
      setFontWeight: () => range,
      setDataValidation: () => range,
      setNote: () => range,
    };
    return range;
  }
  getDataRange() {
    return this.getRange(1, 1, this.rows.length, Math.max(0, ...this.rows.map((line) => line.length)));
  }
  setFrozenRows() {}
  setFrozenColumns() {}
}

function formatDate(date, timeZone, pattern) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return pattern
    .replace('yyyy', parts.year)
    .replace('MM', parts.month)
    .replace('dd', parts.day)
    .replace('HH', parts.hour)
    .replace('mm', parts.minute)
    .replace('ss', parts.second);
}

/** A fresh copy of the script with its own spreadsheet. `sheets` maps a sheet name to its rows. */
export function loadScript({ sheets = {} } = {}) {
  const book = new Map(Object.entries(sheets).map(([name, rows]) => [name, Object.assign(new Sheet(name), { rows: rows.map((line) => [...line]) })]));
  const spreadsheet = {
    getSheetByName: (name) => book.get(name) ?? null,
    insertSheet: (name) => {
      const sheet = new Sheet(name);
      book.set(name, sheet);
      return sheet;
    },
  };
  class FixedDate extends Date {
    constructor(...args) {
      if (args.length) super(...args);
      else super(NOW);
    }
    static now() {
      return NOW;
    }
  }
  const validation = { requireValueInList: () => validation, setAllowInvalid: () => validation, build: () => ({}) };
  const context = vm.createContext({
    Date: FixedDate,
    console: { error() {}, log() {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, newDataValidation: () => validation },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { formatDate },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (content) => ({ content, setMimeType() { return this; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
  });
  vm.runInContext(SOURCE, context, { filename: 'Code.gs' });

  const run = (code) => vm.runInContext(code, context);
  const parse = (output) => JSON.parse(output.content);
  return {
    book,
    run,
    post: (data) => parse(context.doPost({ postData: { contents: typeof data === 'string' ? data : JSON.stringify(data) } })),
    get: (parameter) => parse(context.doGet({ parameter })),
    rows: () => book.get('Записи')?.rows.slice(1) ?? [], // bookings, without the header row

  };
}
