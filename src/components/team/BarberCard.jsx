import { useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { formatRating } from '../../lib/format.js';
import { hoverLift } from '../../lib/motion.js';
import Img from '../Img.jsx';
import Reveal from '../Reveal.jsx';

const PHOTO_DIR = '/images/team';

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.94 6.1 6.56.8-4.83 4.6 1.2 6.5L12 17.3l-5.87 3.2 1.2-6.5L2.5 9.4l6.56-.8L12 2.5z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

// The name button stretches over the whole card; the Instagram link sits above it.
export default function BarberCard({ barber, onOpen }) {
  const reduce = useReducedMotion();
  const { team } = site.ui;
  const { slug, name, role, junior, rating, instagram } = barber;

  return (
    <Reveal
      as="li"
      whileHover={reduce ? undefined : hoverLift}
      className="group relative w-[72%] shrink-0 snap-start sm:w-[44%] md:w-auto"
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <Img src={`${PHOTO_DIR}/${slug}.jpg`} alt="" width={800} height={1000} className="aspect-[4/5] w-full object-cover" />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm leading-snug">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => onOpen(slug)}
              className="text-left after:absolute after:inset-0 after:rounded focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
            >
              {name}
            </button>
          </h3>
          {junior ? (
            <span className="mt-2 inline-block rounded border border-line px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-heading text-concrete">
              {role}
            </span>
          ) : (
            <p className="mt-1 text-xs text-concrete">{role}</p>
          )}
        </div>
        {rating != null && (
          <p className="flex shrink-0 items-center gap-1 text-xs font-bold">
            <StarIcon />
            <span className="sr-only">{team.rating}</span>
            {formatRating(rating)}
          </p>
        )}
      </div>

      <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-heading text-concrete transition-colors duration-300 group-hover:text-text">
          {team.prices} <span aria-hidden="true">→</span>
        </span>
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram — ${name}`}
            className="relative z-10 -mr-3 flex h-11 w-11 items-center justify-center rounded text-concrete transition-colors duration-300 hover:text-text"
          >
            <InstagramIcon />
          </a>
        )}
      </div>
    </Reveal>
  );
}
