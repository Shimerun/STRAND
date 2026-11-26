import { useLayoutEffect, useRef } from 'react';
import { site } from '../../data/site.js';
import { formatRating, pluralUk } from '../../lib/format.js';
import { HEADER_HEIGHT } from '../../lib/scroll.js';
import { hoverLift } from '../../lib/motion.js';
import { MAP_URL } from '../Contacts.jsx';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import StarIcon from '../StarIcon.jsx';
import { GoogleReview, SiteReview } from './ReviewCard.jsx';
import { useGoogleReviews } from './useGoogleReviews.js';
import { usePrefersReducedMotion } from '../../lib/useMediaQuery.js';

const MAX_STARS = 5;

// Google's reviews replace the site's short ones and change the section's height, often while the visitor is
// already further down (at the form, after a link to #booking). Then the page moves by the same amount, so what
// they are looking at stays put. `ref`: an element inside the section; `content`: what changes its height.
function useKeepPlace(ref, content) {
  const height = useRef(0);
  useLayoutEffect(() => {
    const section = ref.current?.closest('section');
    if (!section) return;
    const next = section.offsetHeight;
    const delta = next - height.current;
    // Its bottom before the change was above the screen or under the fixed header: none of it was in view.
    const wasAbove = section.getBoundingClientRect().bottom - delta < HEADER_HEIGHT + 2; // + subpixel slack
    if (height.current && delta && wasAbove) window.scrollBy(0, delta);
    height.current = next;
  }, [ref, content]);
}
const GOOGLE_LIST =
  '-ml-5 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto pb-4 pl-5 pt-2 [scrollbar-width:none] md:ml-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:p-0';

/**
 * Google reviews (rating, count and up to five reviews, with Google's attribution) once they load;
 * until then, or without them, the reviews and rating from site.js.
 */
export default function Reviews() {
  const reduce = usePrefersReducedMotion();
  const rootRef = useRef(null);
  const google = useGoogleReviews(rootRef);
  useKeepPlace(rootRef, google);
  const { ui } = site;
  const labels = ui.reviews;
  const rating = google ? { value: google.rating, count: google.count } : site.rating;
  const reviews = google ? google.reviews : site.reviews.filter((review) => review.text);
  const fullStars = Math.round(rating.value);
  // site.rating is copied from the Google listing too, so both read "N відгуків у Google".
  const countLabel = `${pluralUk(rating.count, labels.count)} ${labels.onGoogle}`;

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
              {/* Without Google's own reviews (no web app) it opens the shop's card there, where they all are. */}
              <a href={google?.url ?? MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs font-bold text-text underline-offset-4 hover:underline">
                {google ? labels.googleMaps : labels.open}
              </a>
            </div>
          </Reveal>
        </div>

        <div className="min-w-0 flex-1">
          {/* Google cards: horizontal scroll-snap on mobile, bleeding to the left edge; grid from md up.
              The site's own short quotes: a plain stack divided by hairlines. */}
          <ul className={google ? GOOGLE_LIST : 'divide-y divide-line'}>
            {reviews.map((review, index) => (
              <Reveal
                as="li"
                key={google ? `${review.author}-${index}` : `${review.name}-${review.date}`}
                index={index}
                whileHover={reduce || !google ? undefined : hoverLift}
                className={google ? 'w-[85%] shrink-0 snap-start sm:w-[60%] md:w-auto' : 'py-8 first:pt-0 last:pb-0'}
              >
                {google ? <GoogleReview review={review} placeUrl={google.url} /> : <SiteReview review={review} />}
              </Reveal>
            ))}
          </ul>
          {google && <p className="mt-6 text-xs leading-relaxed text-concrete">{labels.order}</p>}
        </div>
      </div>
    </Section>
  );
}
