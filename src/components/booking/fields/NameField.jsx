import { site } from '../../../data/site.js';
import Field, { CONTROL, borderFor, controlProps } from './Field.jsx';

const ID = 'booking-name';
const NAME_MAX = 60;

export default function NameField({ value, error, onChange }) {
  const { fields, placeholders } = site.ui.form;

  return (
    <Field id={ID} label={fields.name} error={error}>
      <input
        {...controlProps(ID, error)}
        name="name"
        type="text"
        autoComplete="name"
        required
        aria-required="true"
        maxLength={NAME_MAX}
        placeholder={placeholders.name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} ${borderFor(error)}`}
      />
    </Field>
  );
}
