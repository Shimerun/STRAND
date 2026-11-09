import { motion, useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { formatRating } from '../../lib/format.js';
import { hoverLift } from '../../lib/motion.js';
import Img from '../Img.jsx';
import InstagramIcon from '../InstagramIcon.jsx';
import Reveal from '../Reveal.jsx';
import StarIcon from '../StarIcon.jsx';
import { barberPhoto, PHOTO_RADIUS, PHOTO_TRANSITION, photoLayoutId } from './photo.js';

// The name button stretches over the whole card and opens the barber's profile, into which the photo morphs
// (see photo.js); the Instagram link sits above it.
export default function BarberCard({ barber, index, onOpen }) {
  const reduce = useReducedMotion();
  const { team } = site.ui;
  const { slug, name, role, junior, rating, instagram } = barber;

  return (
    <Reveal
      as="li"
      index={index}
      whileHover={reduce ? undefined : hoverLift}
      className="group relative w-[72%] shrink-0 snap-start sm:w-[44%] md:w-auto"
    >
      <motion.div
        layoutId={reduce ? undefined : photoLayoutId(slug)}
        transition={PHOTO_TRANSITION}
        style={{ borderRadius: PHOTO_RADIUS }}
        className="overflow-hidden border border-line bg-surface"
      >
        <Img src={barberPhoto(slug)} alt={name} width={800} height={1000} className="aspect-[4/5] w-full object-cover" />
      </motion.div>

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
            <span className="mt-2 inline-block rounded border border-line px-2 py-0.5 text-xs font-medium uppercase tracking-heading text-concrete">
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
          {team.profile} <span aria-hidden="true">→</span>
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
