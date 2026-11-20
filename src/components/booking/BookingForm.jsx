import { site } from '../../data/site.js';
import { formatPrice } from '../../lib/format.js';
import { servicesFor } from '../../lib/pricing.js';
import Button from '../Button.jsx';
import BookingSummary from './BookingSummary.jsx';
import ErrorState from './ErrorState.jsx';
import AddonsField from './fields/AddonsField.jsx';
import BarberPicker from './fields/BarberPicker.jsx';
import DateField from './fields/DateField.jsx';
import Field, { CONTROL, InputField, borderFor, controlProps } from './fields/Field.jsx';
import PhoneField from './fields/PhoneField.jsx';
import ServicePicker from './fields/ServicePicker.jsx';
import SlotPicker from './fields/SlotPicker.jsx';
import Step from './fields/Step.jsx';

const COMMENT_ID = 'booking-comment';
const NAME_MAX = 60;
const COMMENT_MAX = 300;

export default function BookingForm({ form, availability }) {
  const copy = site.ui.form;
  const { values, errors, barber, service, price } = form;
  const services = barber ? servicesFor(barber) : site.services;
  // Every barber stays listed, with the chosen service's price; picking one who does not offer it clears the
  // service and says so under it (serviceReset), so a choice made earlier never locks the other field.
  const sending = form.status === 'sending';
  const submitLabel = price ? `${copy.submit} · ${formatPrice(price.value, { from: price.from })}` : copy.submit;

  return (
    <form ref={form.formRef} noValidate onSubmit={form.submit} className="space-y-6">
      <Step index={1} title={copy.steps.choice}>
        <BarberPicker barbers={site.team} service={service} value={barber} error={errors.barber} onChange={form.chooseBarber} />
        <ServicePicker
          services={services}
          barber={barber}
          value={service?.id ?? ''}
          error={errors.service}
          hint={form.serviceReset ? copy.serviceReset : service?.note ?? null}
          onChange={form.chooseService}
        />
        <AddonsField barber={barber} extras={form.extras} onToggle={form.toggleAddon} />
      </Step>

      <Step index={2} title={copy.steps.when}>
        <DateField
          dates={form.dates}
          full={form.full}
          value={values.date}
          error={errors.date}
          onChange={(iso) => form.setField('date', iso)}
        />
        <SlotPicker
          hasService={Boolean(service && barber)}
          availability={availability.state}
          onRetry={availability.retry}
          times={form.times}
          value={form.time}
          error={errors.time}
          slotTaken={form.slotTaken}
          onChange={(time) => form.setField('time', time)}
        />
      </Step>

      <Step index={3} title={copy.steps.contacts}>
        <div className="grid gap-5 md:grid-cols-2">
          <InputField name="name" maxLength={NAME_MAX} value={values.name} error={errors.name} onChange={(name) => form.setField('name', name)} />
          <PhoneField value={values.phone} error={errors.phone} onChange={(phone) => form.setField('phone', phone)} />
        </div>

        <Field id={COMMENT_ID} label={copy.fields.comment}>
          <textarea
            {...controlProps(COMMENT_ID)}
            name="comment"
            rows={2}
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

        <BookingSummary form={form} className="lg:hidden" />

        <div className="space-y-4">
          <div aria-live="polite">{form.status === 'error' && <ErrorState />}</div>
          <Button type="submit" magnetic={false} disabled={sending} className="w-full disabled:cursor-wait md:w-auto">
            {sending ? copy.sending : submitLabel}
          </Button>
          <p className="text-xs leading-relaxed text-concrete">{copy.consent}</p>
        </div>
      </Step>
    </form>
  );
}
