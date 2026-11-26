import { site } from '../../../data/site.js';
import BarberPole from '../../BarberPole.jsx';
import Button from '../../Button.jsx';
import CheckIcon from '../../CheckIcon.jsx';
import PhoneLink from '../../PhoneLink.jsx';
import { CHIP, FieldError, LABEL, errorId } from './Field.jsx';

const ID = 'booking-time';

/**
 * Renders only free times, and only from a list that loaded: availability 'failed' (nothing ever loaded) offers a
 * retry and the phone instead of a grid; 'stale' (a refresh failed) keeps the last list with a note.
 */
export default function SlotPicker({ hasService, availability, onRetry, times, value, error, slotTaken, onChange }) {
  const { fields, slots } = site.ui.form;
  const failed = hasService && availability === 'failed';

  let message = null;
  if (!hasService) message = slots.pickService;
  else if (availability === 'loading') message = slots.loading;
  else if (!failed && times.length === 0) message = slots.none;
  // Without a service there is nothing to pick yet: the service field carries the error. With no list loaded,
  // "pick a time" would ask the impossible: the failure note says what to do instead.
  const shownError = hasService && !failed ? error : null;

  return (
    <fieldset data-invalid={Boolean(error && hasService) || slotTaken} aria-describedby={shownError ? errorId(ID) : undefined}>
      <legend className={LABEL}>{fields.time}</legend>

      <div aria-live="polite" className="space-y-2 text-sm">
        {slotTaken && <p className="text-danger">{slots.taken}</p>}
        {hasService && (failed || availability === 'stale') && (
          <div>
            <p className={failed ? 'text-text' : 'text-concrete'}>{failed ? slots.loadFailed : slots.stale}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-6">
              <Button variant="link" onClick={onRetry} data-focus-fallback>
                {slots.retry}
              </Button>
              {failed && <PhoneLink where="booking_slots" className="inline-flex min-h-11 items-center whitespace-nowrap font-bold text-text underline underline-offset-4" />}
            </div>
          </div>
        )}
        {message && (
          <p className="flex items-center gap-4 text-concrete">
            {message === slots.loading && <BarberPole />}
            {message}
          </p>
        )}
      </div>

      {!message && !failed && (
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
