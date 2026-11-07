import { site } from '../../data/site.js';
import { BOOKING_ID } from '../../lib/scroll.js';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import BookingForm from './BookingForm.jsx';
import SuccessState from './SuccessState.jsx';
import { useAvailability } from './useAvailability.js';
import { useBookingForm } from './useBookingForm.js';

export default function Booking() {
  const availability = useAvailability();
  const form = useBookingForm(availability);
  const { title, subtitle } = site.ui.form;
  const success = form.status === 'success';

  return (
    <Section id={BOOKING_ID} data-scissors-end>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div>
          <SectionTitle>{title}</SectionTitle>
          <Reveal as="p" className="mt-4 leading-relaxed text-concrete md:text-lg">
            {subtitle}
          </Reveal>
        </div>

        <div className="rounded border border-line bg-surface p-5 md:p-8">
          <div aria-live="polite">{success && <SuccessState />}</div>
          {!success && <BookingForm form={form} availability={availability} />}
        </div>
      </div>
    </Section>
  );
}
