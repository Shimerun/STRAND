import { motion, useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { formatDuration, formatPrice } from '../../lib/format.js';
import { hoverLift } from '../../lib/motion.js';
import { isFromPrice, minPrice } from '../../lib/pricing.js';
import { EVENTS } from '../../lib/track.js';
import ArrowIcon from '../ArrowIcon.jsx';
import Button from '../Button.jsx';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import PriceMenu from './PriceMenu.jsx';

const LABEL = 'text-xs font-medium uppercase tracking-heading text-concrete';
const CARD = 'flex h-full flex-col rounded border border-line bg-bg p-6 transition-colors duration-300 hover:border-concrete';
// Phones: one row of cards to swipe instead of a column three screens tall. It bleeds to both screen edges (over
// the right gutter too), so the next card runs off the screen instead of being cut short mid-page. A grid from sm up.
const ROW =
  '-ml-5 -mr-[var(--gutter)] mt-10 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto pb-2 pl-5 pr-[var(--gutter)] pt-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:p-0 lg:grid-cols-6 lg:gap-6';
// max-sm:h-auto: a percentage height stops the row from stretching the cards to one height.
const ITEM = 'w-[80%] shrink-0 snap-start max-sm:h-auto sm:w-auto';
// The first two cards lead: half the row each from lg (the first a whole row at sm); the rest take a third.
const SPANS = ['sm:col-span-2 lg:col-span-3', 'lg:col-span-3'];
const SPAN = 'lg:col-span-2';

/**
 * The featured services (site.js) are static cards. Everything else follows as a compact price menu, so the list
 * of twelve does not become twelve equal cards.
 */
export default function Services() {
  const { openBooking } = useBooking();
  const reduce = useReducedMotion();
  const { cta, sections, services: labels } = site.ui;
  const featured = site.services.filter((service) => service.featured);
  const rest = site.services.filter((service) => !service.featured);

  const content = (service) => (
    <>
      <h3 className="text-sm leading-snug">{service.name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-concrete">{service.description}</p>
      {service.note && <p className="mt-2 text-xs font-medium text-text/80">{service.note}</p>}

      <dl className="mt-auto flex flex-wrap items-end gap-x-8 gap-y-4 pt-6">
        <div>
          <dt className={LABEL}>{labels.price}</dt>
          <dd className="mt-2 text-2xl font-extrabold leading-none">{formatPrice(minPrice(service), { from: isFromPrice(service) })}</dd>
        </div>
        <div>
          <dt className={LABEL}>{labels.duration}</dt>
          <dd className="mt-2 text-sm font-bold">{formatDuration(service.durationMin)}</dd>
        </div>
      </dl>

      <Button
        variant="link"
        className="mt-4 self-start"
        track={{ name: EVENTS.bookClick, where: 'services', service: service.id }}
        onClick={() => openBooking({ service: service.id })}
      >
        {cta.book}
        <ArrowIcon className="transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
      </Button>
    </>
  );

  return (
    <Section id="services" tone="surface">
      <SectionTitle>{sections.services}</SectionTitle>

      <ul className={ROW}>
        {featured.map((service, index) => (
          <motion.li key={service.id} whileHover={reduce ? undefined : hoverLift} className={`${CARD} ${ITEM} ${SPANS[index] ?? SPAN}`}>
            {content(service)}
          </motion.li>
        ))}
      </ul>

      {rest.length > 0 && (
        <Reveal className="mt-14 md:mt-20">
          <h3 className="text-sm leading-snug">{labels.more}</h3>
          <div className="mt-5">
            <PriceMenu services={rest} />
          </div>
        </Reveal>
      )}

      <Reveal as="p" className="mt-6 text-sm text-concrete">
        {labels.priceNote}
      </Reveal>
    </Section>
  );
}
