import { site } from '../../../data/site.js';
import BarberPole from '../../BarberPole.jsx';
import Button from '../../Button.jsx';
import CheckIcon from '../../CheckIcon.jsx';
import { CHIP, FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-time';

// Renders only free times; taken slots are never shown.
export default function SlotPicker({ hasService, availability, onRetry, times, value, error, slotTaken, onChange }) {
  const { fields, slots } = site.ui.form;

  let message = null;
  if (!hasService) message = slots.pickService;
  else if (availability === 'loading') message = slots.loading;
  else if (times.length === 0) message = slots.none;
  // Without a service there is nothing to pick yet: the service field carries the error.
  const shownError = hasService ? error : null;

  return (
    <fieldset data-invalid={Boolean(shownError) || slotTaken} aria-describedby={shownError ? errorId(ID) : undefined}>
      <legend className={LABEL}>{fields.time}</legend>

      <div aria-live="polite" className="space-y-2 text-sm">
        {slotTaken && <p className="text-danger">{slots.taken}</p>}
        {hasService && availability === 'failed' && (
          <div>
            <p className="text-concrete">{slots.loadFailed}</p>
            <Button variant="link" onClick={onRetry}>
              {slots.retry}
            </Button>
          </div>
        )}
        {message && (
          <p className="flex items-center gap-4 text-concrete">
            {message === slots.loading && <BarberPole />}
            {message}
          </p>
        )}
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
              <span className={`${CHIP} relative text-sm font-bold tabular-nums`}>
                {time}
                {value === time && <CheckIcon size={10} className="absolute right-1 top-1" />}
              </span>
            </label>
          ))}
        </div>
      )}

      <FieldError id={ID} error={shownError} />
    </fieldset>
  );
}
