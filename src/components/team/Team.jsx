import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { site } from '../../data/site.js';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import BarberCard from './BarberCard.jsx';
import PriceDrawer from './PriceDrawer.jsx';

export default function Team() {
  const [openSlug, setOpenSlug] = useState(null);
  const close = useCallback(() => setOpenSlug(null), []);
  const openBarber = site.team.find((barber) => barber.slug === openSlug);

  return (
    <Section id="team">
      <SectionTitle>{site.ui.sections.team}</SectionTitle>

      {/* Horizontal scroll-snap on mobile, bleeding to the left edge; grid from md up. */}
      <ul className="-ml-5 mt-8 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto pb-4 pl-5 pt-2 [scrollbar-width:none] md:ml-0 md:mt-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:p-0 lg:gap-8">
        {site.team.map((barber) => (
          <BarberCard key={barber.slug} barber={barber} onOpen={setOpenSlug} />
        ))}
      </ul>

      {/* Portaled so transformed ancestors never become the drawer's containing block. */}
      {createPortal(
        <AnimatePresence>
          {openBarber && <PriceDrawer key={openBarber.slug} barber={openBarber} onClose={close} />}
        </AnimatePresence>,
        document.body,
      )}
    </Section>
  );
}
