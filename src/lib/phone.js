const PREFIX = '+380';
const NATIONAL_LENGTH = 9;
const VALID_PHONE = /^\+380[1-9]\d{8}$/;

// Accepts 0671234567, 380671234567 and +380… (also when pasted over the fixed prefix).
export function nationalDigits(raw) {
  let digits = String(raw).replace(/\D/g, '');
  while (digits.startsWith('380')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, NATIONAL_LENGTH);
}

// "+380 XX XXX XX XX"; an empty number keeps the fixed prefix.
export function formatPhone(raw) {
  const n = nationalDigits(raw);
  const groups = [n.slice(0, 2), n.slice(2, 5), n.slice(5, 7), n.slice(7, 9)].filter(Boolean);
  return `${PREFIX} ${groups.join(' ')}`;
}

export function normalizePhone(raw) {
  const n = nationalDigits(raw);
  return n ? `${PREFIX}${n}` : '';
}

export function isValidPhone(normalized) {
  return VALID_PHONE.test(normalized);
}
