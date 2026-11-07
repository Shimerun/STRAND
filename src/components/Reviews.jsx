import { useReducedMotion } from 'framer-motion';
import { site } from '../data/site.js';
import { formatDate, formatRating, pluralUk } from '../lib/format.js';
import { hoverLift } from '../lib/motion.js';
import Reveal from './Reveal.jsx';
import Section from './Section.jsx';
import SectionTitle from './SectionTitle.jsx';
import StarIcon from './StarIcon.jsx';

const MAX_STARS = 5;

export default function Reviews() {
  const reduce = useReducedMotion();
  const { rating, ui } = site;
  const reviews = site.reviews.filter((review) => review.text);
  const fullStars = Math.round(rating.value);

  return (
    <Section id="reviews">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="shrink-0">
          <SectionTitle>{ui.sections.reviews}</SectionTitle>
          <Reveal className="mt-8 flex items-end gap-5">
            <p className="text-7xl font-extrabold leading-none">
              <span className="sr-only">{ui.team.rating} </span>
              {formatRating(rating.value)}
            </p>
            <div className="pb-1">
              <div className="flex gap-1">
                {Array.from({ length: MAX_STARS }, (_, index) => (
                  <StarIcon key={index} size={18} className={index < fullStars ? 'text-text' : 'text-line'} />
                ))}
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-heading text-concrete">
                {rating.count} {pluralUk(rating.count, ui.reviews.verified)}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Horizontal scroll-snap on mobile, bleeding to the left edge; grid from md up. */}
        <ul className="-ml-5 flex min-w-0 flex-1 snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto pb-4 pl-5 pt-2 [scrollbar-width:none] md:ml-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:p-0">
          {reviews.map((review) => (
            <Reveal
              as="li"
              key={`${review.name}-${review.date}`}
              whileHover={reduce ? undefined : hoverLift}
              className="w-[85%] shrink-0 snap-start sm:w-[60%] md:w-auto"
            >
              <figure className="flex h-full flex-col rounded border border-line bg-surface p-6">
                <span aria-hidden="true" className="text-4xl font-extrabold leading-none text-concrete">
                  “
                </span>
                <blockquote className="mt-2 flex-1 leading-relaxed">
                  <p>{review.text}</p>
                </blockquote>
                <figcaption className="mt-6 text-xs uppercase tracking-heading text-concrete">
                  <cite className="font-bold not-italic text-text">{review.name}</cite>
                  {review.date && (
                    <>
                      {' · '}
                      <time dateTime={review.date}>{formatDate(review.date)}</time>
                    </>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
