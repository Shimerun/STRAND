import { useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { formatRating, pluralUk } from '../../lib/format.js';
import { hoverLift } from '../../lib/motion.js';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import StarIcon from '../StarIcon.jsx';
import ReviewCard from './ReviewCard.jsx';
import { useGoogleReviews } from './useGoogleReviews.js';

const MAX_STARS = 5;

/**
 * Google reviews (rating, count and up to five reviews, with Google's attribution) once they load;
 * until then, or without them, the reviews and rating from site.js.
 */
export default function Reviews() {
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const google = useGoogleReviews(rootRef);
  const { ui } = site;
  const labels = ui.reviews;
  const rating = google ? { value: google.rating, count: google.count } : site.rating;
  const reviews = google ? google.reviews : site.reviews.filter((review) => review.text);
  const fullStars = Math.round(rating.value);
  const countLabel = google ? `${pluralUk(rating.count, labels.count)} ${labels.onGoogle}` : pluralUk(rating.count, labels.verified);

  return (
    <Section id="reviews" tone="surface">
      <div ref={rootRef} className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
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
                {rating.count} {countLabel}
              </p>
              {google?.url && (
                <a href={google.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-bold text-text underline-offset-4 hover:underline">
                  {labels.googleMaps}
                </a>
              )}
            </div>
          </Reveal>
        </div>

        <div className="min-w-0 flex-1">
          {/* Horizontal scroll-snap on mobile, bleeding to the left edge; grid from md up. */}
          <ul className="-ml-5 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto pb-4 pl-5 pt-2 [scrollbar-width:none] md:ml-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:p-0">
            {reviews.map((review, index) => (
              <Reveal
                as="li"
                key={google ? `${review.author}-${index}` : `${review.name}-${review.date}`}
                index={index}
                whileHover={reduce ? undefined : hoverLift}
                className="w-[85%] shrink-0 snap-start sm:w-[60%] md:w-auto"
              >
                <ReviewCard review={review} google={Boolean(google)} />
              </Reveal>
            ))}
          </ul>
          {google && <p className="mt-6 text-xs leading-relaxed text-concrete">{labels.order}</p>}
        </div>
      </div>
    </Section>
  );
}
