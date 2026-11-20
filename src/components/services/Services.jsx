import { site } from '../../data/site.js';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import PriceMenu from './PriceMenu.jsx';

/**
 * Every service as a price menu (name, price range, time on one row; what it is and the booking link when opened),
 * so they compare at a glance on a phone too: the cuts (`featured` in site.js) first, then care and colour.
 */
export default function Services() {
  const { sections, services: labels } = site.ui;
  const groups = [
    { title: labels.main, services: site.services.filter((service) => service.featured) },
    { title: labels.more, services: site.services.filter((service) => !service.featured) },
  ].filter((group) => group.services.length > 0);

  return (
    <Section id="services">
      <SectionTitle>{sections.services}</SectionTitle>
      {/* Before the first range, which it explains: the exact price is in the profile and the booking form. */}
      <Reveal as="p" className="mt-6 text-sm text-concrete md:text-base">
        {labels.priceNote}
      </Reveal>

      {groups.map(({ title, services }) => (
        <Reveal key={title} className="mt-10 md:mt-14">
          <h3 className="text-sm leading-snug">{title}</h3>
          <div className="mt-4">
            <PriceMenu services={services} />
          </div>
        </Reveal>
      ))}
    </Section>
  );
}
