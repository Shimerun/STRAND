import { site } from '../../../data/site.js';
import { CHIP, FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-time';

// Renders only free times; taken slots are never shown.
export default function SlotPicker({ hasService, availability, times, value, error, slotTaken, onChange }) {
  const { fields, slots } = site.ui.form;

  let message = null;
  if (!hasService) message = slots.pickService;
  else if (availability === 'loading') message = slots.loading;
  else if (times.length === 0) message = slots.none;

  return (
    <fieldset data-invalid={Boolean(error)} aria-describedby={error ? errorId(ID) : undefined}>
      <legend className={LABEL}>{fields.time}</legend>

      <div aria-live="polite" className="space-y-2 text-sm">
        {slotTaken && <p className="text-danger">{slots.taken}</p>}
        {hasService && availability === 'failed' && <p className="text-concrete">{slots.loadFailed}</p>}
        {message && <p className="text-concrete">{message}</p>}
      </div>

      {!message && (
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {times.map((time) => (
            <label key={time} className="relative cursor-pointer">
              <input
                type="radio"
                name="time"
                value={time}
                checked={value === time}
                onChange={() => onChange(time)}
                className="peer sr-only"
              />
              <span className={`${CHIP} text-sm font-bold tabular-nums`}>{time}</span>
            </label>
          ))}
        </div>
      )}

      <FieldError id={ID} error={error} />
    </fieldset>
  );
}
