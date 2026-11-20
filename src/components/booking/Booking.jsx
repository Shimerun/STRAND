import { site } from '../../data/site.js';
import { bookingEnabled } from '../../lib/booking.js';
import { BOOKING_ID } from '../../lib/scroll.js';
import { EVENTS } from '../../lib/track.js';
import Button from '../Button.jsx';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import BookingForm from './BookingForm.jsx';
import BookingSummary from './BookingSummary.jsx';
import SuccessState from './SuccessState.jsx';
import Ticket from './Ticket.jsx';
import { useAvailability } from './useAvailability.js';
import { useBookingForm } from './useBookingForm.js';

// No web app configured: a form that cannot send would waste the visitor's time, so offer the phone.
function Unavailable() {
  return (
    <div className="space-y-6">
      <p className="text-lg leading-relaxed">{site.ui.form.unavailable}</p>
      <Button href={`tel:${site.phone}`} track={{ name: EVENTS.callClick, where: 'booking_unavailable' }} className="w-full md:w-auto">
        {site.phoneDisplay}
      </Button>
    </div>
  );
}

export default function Booking() {
  const availability = useAvailability();
  const form = useBookingForm(availability);
  const { cta, form: copy } = site.ui;
  const success = form.status === 'success';

  return (
    // The shears fade out as this section comes up, so it needs no gutter for them: the form gets even sides.
    <Section id={BOOKING_ID} gutter={false} data-scissors-end>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div>
          <div className="lg:sticky lg:top-[calc(theme(spacing.header)+2rem)]">
            <SectionTitle>{bookingEnabled ? copy.title : cta.bookByPhone}</SectionTitle>
            {bookingEnabled && (
              <Reveal as="p" className="mt-4 leading-relaxed text-concrete md:text-lg">
                {copy.subtitle}
              </Reveal>
            )}
            {bookingEnabled && !success && <BookingSummary form={form} className="mt-10 hidden lg:block" />}
          </div>
        </div>

        <div className="rounded border border-line bg-surface p-4 sm:p-5 md:p-8">
          {bookingEnabled ? (
            <>
              <div aria-live="polite">{success && <SuccessState />}</div>
              {success ? (
                <>
                  <Ticket booked={form.booked} />
                  <Button variant="ghost" onClick={form.again} className="mt-6 w-full sm:w-auto">
                    {cta.bookAgain}
                  </Button>
                </>
              ) : (
                <BookingForm form={form} availability={availability} />
              )}
            </>
          ) : (
            <Unavailable />
          )}
        </div>
      </div>
    </Section>
  );
}
