import { site } from '../../data/site.js';
import { isValidPhone, normalizePhone } from '../../lib/phone.js';

const NAME_MIN = 2;
const e = site.ui.form.errors;

// Each rule returns a Ukrainian message or null. Key order = form order.
export const RULES = {
  barber: (v) => (v ? null : e.barberRequired),
  service: (v) => (v ? null : e.serviceRequired),
  date: (v) => (v ? null : e.dateRequired),
  time: (v) => (v ? null : e.timeRequired),
  name: (v) => {
    const name = v.trim();
    if (!name) return e.nameRequired;
    return name.length < NAME_MIN ? e.nameShort : null;
  },
  phone: (v) => {
    const phone = normalizePhone(v);
    if (!phone) return e.phoneRequired;
    return isValidPhone(phone) ? null : e.phoneInvalid;
  },
};

export function withError(errors, key, message) {
  const next = { ...errors };
  if (message) next[key] = message;
  else delete next[key];
  return next;
}

export function validate(values) {
  return Object.keys(RULES).reduce((errors, key) => withError(errors, key, RULES[key](values[key])), {});
}
