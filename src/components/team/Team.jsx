import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { site } from '../../data/site.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import BarberCard from './BarberCard.jsx';
import BarberProfile from './BarberProfile.jsx';

// The open profile lives in the booking context: a work in the gallery opens its barber's profile too.
export default function Team() {
  const { profile, openProfile, closeProfile } = useBooking();
  const openBarber = site.team.find((barber) => barber.slug === profile);

  return (
    // Clips the orbiting works of a right-hand card at the screen edge instead of widening the page.
    <Section id="team" className="overflow-x-clip">
      <SectionTitle>{site.ui.sections.team}</SectionTitle>

      {/* Horizontal scroll-snap on mobile, bleeding to the left edge; grid from md up. */}
      <ul className="-ml-5 mt-8 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto pb-4 pl-5 pt-2 [scrollbar-width:none] md:ml-0 md:mt-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:p-0 lg:gap-8">
        {site.team.map((barber, index) => (
          <BarberCard key={barber.slug} barber={barber} index={index} onOpen={openProfile} />
        ))}
      </ul>

      {/* Portaled so transformed ancestors never become the profile's containing block. */}
      {createPortal(
        <AnimatePresence>
          {openBarber && <BarberProfile key={openBarber.slug} barber={openBarber} onClose={closeProfile} />}
        </AnimatePresence>,
        document.body,
      )}
    </Section>
  );
}
