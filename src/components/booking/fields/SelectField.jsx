import Field, { CONTROL, borderFor, controlProps } from './Field.jsx';

export default function SelectField({ id, label, value, error, hint, onChange, children }) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <select
          {...controlProps(id, error, hint)}
          required
          aria-required="true"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${CONTROL} ${borderFor(error)} appearance-none pr-11`}
        >
          {children}
        </select>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-concrete"
        >
          <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </Field>
  );
}
