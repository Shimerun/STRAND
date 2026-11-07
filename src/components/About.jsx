import { site } from '../data/site.js';
import PhotoReveal from './PhotoReveal.jsx';
import Reveal from './Reveal.jsx';
import Section from './Section.jsx';
import SectionTitle from './SectionTitle.jsx';

export default function About() {
  return (
    <Section id="about" tone="surface">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionTitle>{site.ui.sections.about}</SectionTitle>
          <div className="mt-8 space-y-5 leading-relaxed text-concrete md:text-lg">
            {site.about.map((paragraph) => (
              <Reveal as="p" key={paragraph} className="first:text-text">
                {paragraph}
              </Reveal>
            ))}
          </div>
        </div>
        <PhotoReveal src={site.images.about} alt={site.ui.alt.about} width={1200} height={1500} className="aspect-[4/5] rounded" />
      </div>

      <Reveal as="ul" className="mt-12 flex flex-wrap gap-2 md:mt-16">
        {site.amenities.map((amenity) => (
          <li
            key={amenity}
            className="rounded border border-line px-4 py-2 text-xs font-medium uppercase tracking-heading text-concrete"
          >
            {amenity}
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
