export const LABEL = 'mb-2 block text-xs font-medium uppercase tracking-heading text-concrete';

export const CONTROL =
  'block w-full rounded border bg-bg px-4 py-3 text-base text-text placeholder:text-concrete transition-colors duration-300 hover:border-concrete';

export const borderFor = (error) => (error ? 'border-danger' : 'border-edge');

// Radio chip: the input is `peer sr-only` right before this span.
export const CHIP =
  'flex min-h-11 flex-col items-center justify-center rounded border border-edge px-3 py-2 text-text transition-colors duration-300 hover:border-concrete peer-checked:border-text peer-checked:bg-text peer-checked:text-bg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';

// Dashed button that folds a part of the form in and out.
export const TOGGLE =
  'flex min-h-11 w-full items-center justify-between gap-4 rounded border border-dashed border-edge px-4 py-3 text-left text-sm font-bold transition-colors duration-300 hover:border-concrete';

export const errorId = (id) => `${id}-error`;
const hintId = (id) => `${id}-hint`;

export function controlProps(id, error, hint) {
  const describedBy = [error && errorId(id), hint && !error && hintId(id)].filter(Boolean).join(' ');
  return { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy || undefined };
}

export function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={errorId(id)} className="mt-2 text-sm text-danger">
      {error}
    </p>
  );
}

export default function Field({ id, label, error, hint, children }) {
  return (
    <div data-invalid={Boolean(error)}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      <FieldError id={id} error={error} />
      {hint && !error && (
        <p id={hintId(id)} className="mt-2 text-sm text-concrete">
          {hint}
        </p>
      )}
    </div>
  );
}
