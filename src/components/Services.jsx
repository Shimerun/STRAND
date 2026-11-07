import { useReducedMotion } from 'framer-motion';
import { site } from '../data/site.js';
import { useBooking } from '../lib/bookingContext.jsx';
import { formatDuration, formatPrice } from '../lib/format.js';
import { hoverLift } from '../lib/motion.js';
import { isFromPrice, minPrice } from '../lib/pricing.js';
import { EVENTS } from '../lib/track.js';
import Button from './Button.jsx';
import Reveal from './Reveal.jsx';
import Section from './Section.jsx';
import SectionTitle from './SectionTitle.jsx';

const LABEL = 'text-[0.6875rem] font-medium uppercase tracking-heading text-concrete';

export default function Services() {
  const { openBooking } = useBooking();
  const reduce = useReducedMotion();
  const { cta, sections, services: labels } = site.ui;

  return (
    <Section id="services">
      <SectionTitle>{sections.services}</SectionTitle>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {site.services.map((service) => (
          <Reveal
            as="li"
            key={service.id}
            whileHover={reduce ? undefined : hoverLift}
            className="flex flex-col rounded border border-line bg-surface p-6"
          >
            <h3 className="text-sm leading-snug">{service.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-concrete">{service.description}</p>
            {service.note && <p className="mt-2 text-xs font-medium text-text/80">{service.note}</p>}

            <dl className="mt-auto flex gap-8 pt-6">
              <div>
                <dt className={LABEL}>{labels.duration}</dt>
                <dd className="mt-1 text-sm font-bold">{formatDuration(service.durationMin)}</dd>
              </div>
              <div>
                <dt className={LABEL}>{labels.price}</dt>
                <dd className="mt-1 text-sm font-bold">
                  {formatPrice(minPrice(service), { from: isFromPrice(service) })}
                </dd>
              </div>
            </dl>

            <Button
              variant="ghost"
              className="mt-5 w-full"
              track={{ name: EVENTS.bookClick, where: 'services', service: service.id }}
              onClick={() => openBooking({ service: service.id })}
            >
              {cta.book}
            </Button>
          </Reveal>
        ))}
      </ul>

      <Reveal as="p" className="mt-6 text-sm text-concrete">
        {labels.priceNote}
      </Reveal>
    </Section>
  );
}
