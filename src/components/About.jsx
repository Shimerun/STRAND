import { site } from '../data/site.js';
import { assetUrl } from '../lib/assetUrl.js';
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
        <PhotoReveal src={assetUrl(site.images.about)} alt={site.ui.alt.about} width={1200} height={1500} className="aspect-[4/5] rounded" />
      </div>

      {/* Phones: one line to swipe, bleeding to the left edge and fading out on the right (the end padding lets the
          last item clear the fade), instead of seven stacked rows. Wraps from md up. */}
      <Reveal
        as="ul"
        className="-ml-5 mt-12 flex gap-2 overflow-x-auto pl-5 pr-12 [mask-image:linear-gradient(to_right,#000_80%,transparent)] [scrollbar-width:none] md:ml-0 md:mt-16 md:flex-wrap md:overflow-visible md:p-0 md:[mask-image:none]"
      >
        {site.amenities.map((amenity) => (
          <li
            key={amenity}
            className="shrink-0 whitespace-nowrap rounded border border-line px-4 py-2 text-xs font-medium uppercase tracking-heading text-concrete"
          >
            {amenity}
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
