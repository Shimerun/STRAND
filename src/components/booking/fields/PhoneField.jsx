import { site } from '../../../data/site.js';
import { formatPhone, nationalDigits } from '../../../lib/phone.js';
import Field, { CONTROL, borderFor, controlProps } from './Field.jsx';

const ID = 'booking-phone';

// The +380 prefix appears on focus and cannot be deleted; an untouched field stays empty.
export default function PhoneField({ value, error, onChange }) {
  const { fields, placeholders } = site.ui.form;

  return (
    <Field id={ID} label={fields.phone} error={error}>
      <input
        {...controlProps(ID, error)}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        aria-required="true"
        placeholder={placeholders.phone}
        value={value}
        onFocus={() => {
          if (!value) onChange(formatPhone(''));
        }}
        onBlur={() => {
          if (!nationalDigits(value)) onChange('');
        }}
        onChange={(event) => onChange(formatPhone(event.target.value))}
        className={`${CONTROL} ${borderFor(error)} tabular-nums`}
      />
    </Field>
  );
}
