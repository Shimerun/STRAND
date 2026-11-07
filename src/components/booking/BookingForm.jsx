import { site } from '../../data/site.js';
import { servicesFor } from '../../lib/pricing.js';
import { ANY_BARBER } from '../../lib/slots.js';
import Button from '../Button.jsx';
import ErrorState from './ErrorState.jsx';
import DateField from './fields/DateField.jsx';
import Field, { CONTROL, borderFor, controlProps } from './fields/Field.jsx';
import NameField from './fields/NameField.jsx';
import PhoneField from './fields/PhoneField.jsx';
import PriceLine from './fields/PriceLine.jsx';
import SelectField from './fields/SelectField.jsx';
import SlotPicker from './fields/SlotPicker.jsx';

const COMMENT_ID = 'booking-comment';
const COMMENT_MAX = 300;

export default function BookingForm({ form, availability }) {
  const copy = site.ui.form;
  const { values, errors, barber, service } = form;
  const services = barber === ANY_BARBER ? site.services : servicesFor(barber);
  const sending = form.status === 'sending';

  return (
    <form ref={form.formRef} noValidate onSubmit={form.submit} className="space-y-7">
      <div className="grid gap-6 md:grid-cols-2">
        <SelectField
          id="booking-barber"
          label={copy.fields.barber}
          value={barber}
          error={errors.barber}
          onChange={form.chooseBarber}
        >
          <option value={ANY_BARBER}>{copy.anyBarber}</option>
          {site.team.map(({ slug, name }) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="booking-service"
          label={copy.fields.service}
          value={service?.id ?? ''}
          error={errors.service}
          hint={form.serviceReset ? copy.serviceReset : null}
          onChange={form.chooseService}
        >
          <option value="" disabled>
            {copy.placeholders.service}
          </option>
          {services.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </SelectField>
      </div>

      <PriceLine barber={barber} service={service} />

      <DateField dates={form.dates} value={values.date} error={errors.date} onChange={(iso) => form.setField('date', iso)} />

      <SlotPicker
        hasService={Boolean(service)}
        availability={availability.state}
        times={form.times}
        value={form.time}
        error={errors.time}
        slotTaken={form.slotTaken}
        onChange={(time) => form.setField('time', time)}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <NameField value={values.name} error={errors.name} onChange={(name) => form.setField('name', name)} />
        <PhoneField value={values.phone} error={errors.phone} onChange={(phone) => form.setField('phone', phone)} />
      </div>

      <Field id={COMMENT_ID} label={copy.fields.comment}>
        <textarea
          {...controlProps(COMMENT_ID)}
          name="comment"
          rows={3}
          maxLength={COMMENT_MAX}
          placeholder={copy.placeholders.comment}
          value={values.comment}
          onChange={(event) => form.setField('comment', event.target.value)}
          className={`${CONTROL} ${borderFor()} resize-y`}
        />
      </Field>

      {/* Honeypot: bots fill every field, people never see this one. */}
      <div aria-hidden="true" className="sr-only">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => form.setField('website', event.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div aria-live="polite">{form.status === 'error' && <ErrorState />}</div>
        <Button type="submit" disabled={sending} className="w-full disabled:cursor-wait disabled:opacity-60 md:w-auto">
          {sending ? copy.sending : copy.submit}
        </Button>
        <p className="text-xs leading-relaxed text-concrete">{copy.consent}</p>
      </div>
    </form>
  );
}
