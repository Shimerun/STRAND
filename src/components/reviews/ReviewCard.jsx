import { site } from '../../data/site.js';
import { formatDate } from '../../lib/format.js';
import StarIcon from '../StarIcon.jsx';

const STARS = 5;
const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' };
const LINK = 'underline-offset-4 transition-colors duration-300 hover:text-text hover:underline';

function Stars({ value }) {
  const { ratingOf } = site.ui.reviews;
  return (
    <span role="img" aria-label={`${ratingOf}: ${value} / ${STARS}`} className="flex gap-0.5">
      {Array.from({ length: STARS }, (_, index) => (
        <StarIcon key={index} size={12} className={index < Math.round(value) ? 'text-text' : 'text-line'} />
      ))}
    </span>
  );
}

// A review from Google: author with photo and profile link, stars, text, and a link to it on Google Maps.
// placeUrl: the place's own Google page, the way to the full text when a long review has no link of its own.
export function GoogleReview({ review, placeUrl }) {
  const link = review.url ?? placeUrl;
  const { open, translated } = site.ui.reviews;
  const author = review.authorUrl ? (
    <a href={review.authorUrl} {...EXTERNAL} className={LINK}>
      {review.author}
    </a>
  ) : (
    review.author
  );

  return (
    <figure className="flex h-full flex-col rounded border border-line bg-bg p-6">
      <figcaption className="flex items-center gap-3">
        {review.photo ? (
          <img src={review.photo} alt="" width={36} height={36} loading="lazy" referrerPolicy="no-referrer" className="h-9 w-9 shrink-0 rounded-full" />
        ) : (
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold">
            {review.author[0]}
          </span>
        )}
        <span className="min-w-0">
          <cite className="block truncate text-sm font-bold not-italic">{author}</cite>
          <span className="mt-1 flex items-center gap-2 text-xs text-concrete">
            <Stars value={review.rating} />
            {review.time}
          </span>
        </span>
      </figcaption>
      <blockquote className="mt-4 flex-1 leading-relaxed">
        <p className="line-clamp-[8]">{review.text}</p>
      </blockquote>
      <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-concrete">
        {review.translated && <span>{translated}</span>}
        {link && (
          <a href={link} {...EXTERNAL} className={`${LINK} inline-flex min-h-11 items-center font-bold text-text`}>
            {open}
          </a>
        )}
      </p>
    </figure>
  );
}

// A review kept in site.js (shown when Google reviews are not set up or cannot be reached): a line or two, so it
// is set large and bare instead of boxed like the long Google ones.
export function SiteReview({ review }) {
  return (
    <figure>
      <blockquote className="text-balance text-2xl font-medium leading-snug md:text-4xl md:leading-tight">
        <p>«{review.text}»</p>
      </blockquote>
      <figcaption className="mt-4 text-xs uppercase tracking-heading text-concrete">
        <cite className="font-bold not-italic text-text">{review.name}</cite>
        {review.date && (
          <>
            {' · '}
            <time dateTime={review.date}>{formatDate(review.date)}</time>
          </>
        )}
      </figcaption>
    </figure>
  );
}
