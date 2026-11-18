import { formatPhone, nationalDigits } from '../../../lib/phone.js';
import { InputField } from './Field.jsx';

// The +380 prefix appears on focus and cannot be deleted; an untouched field stays empty.
export default function PhoneField({ value, error, onChange }) {
  return (
    <InputField
      name="phone"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={value}
      error={error}
      onFocus={() => {
        if (!value) onChange(formatPhone(''));
      }}
      onBlur={() => {
        if (!nationalDigits(value)) onChange('');
      }}
      onChange={(value) => onChange(formatPhone(value))}
      className="tabular-nums"
    />
  );
}
