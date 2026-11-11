import { motion, useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { formatRating } from '../../lib/format.js';
import { hoverLift } from '../../lib/motion.js';
import ArrowIcon from '../ArrowIcon.jsx';
import Img from '../Img.jsx';
import InstagramIcon from '../InstagramIcon.jsx';
import Reveal from '../Reveal.jsx';
import StarIcon from '../StarIcon.jsx';
import { barberPhoto, PHOTO_RADIUS, PHOTO_TRANSITION, photoLayoutId } from './photo.js';
import WorksOrbit from './WorksOrbit.jsx';

// The name button stretches over the whole card and opens the barber's profile, into which the photo morphs
// (see photo.js); the Instagram link sits above it.
export default function BarberCard({ barber, index, onOpen }) {
  const reduce = useReducedMotion();
  const { team } = site.ui;
  const { slug, name, role, rating, instagram } = barber;

  return (
    <Reveal
      as="li"
      index={index}
      whileHover={reduce ? undefined : hoverLift}
      // Raised while its works orbit (hover, focus, or in view on touch), so they pass over the neighbouring cards.
      className="group relative flex w-[72%] shrink-0 snap-start flex-col hover:z-10 has-[:focus-visible]:z-10 has-[[data-active]]:z-10 sm:w-[44%] md:w-auto"
    >
      {/* One 3D scene: the browser depth-sorts the orbiting works against the portrait (WorksOrbit). */}
      <div className="relative [perspective:1000px] [transform-style:preserve-3d]">
        <motion.div
          layoutId={reduce ? undefined : photoLayoutId(slug)}
          transition={PHOTO_TRANSITION}
          style={{ borderRadius: PHOTO_RADIUS }}
          className="overflow-hidden border border-line bg-surface"
        >
          <Img src={barberPhoto(slug)} alt={name} width={800} height={1000} className="aspect-[4/5] w-full object-cover" />
        </motion.div>
        {/* Says the card opens: touch screens have no hover to hint it. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-text/30 bg-bg/80 text-text transition-colors duration-300 group-hover:border-text group-hover:bg-text group-hover:text-bg"
        >
          <ArrowIcon className="-rotate-45" />
        </span>
        <WorksOrbit slug={slug} />
      </div>

      {/* Grows so the profile button lines up across cards whatever the name/role height. */}
      <div className="mt-4 flex flex-1 items-start justify-between gap-3">
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
          <span className="mt-2 inline-block rounded border border-line px-2 py-0.5 text-xs font-medium uppercase tracking-heading text-concrete">
            {role}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {rating != null && (
            <p className="flex items-center gap-1 text-xs font-bold">
              <StarIcon />
              <span className="sr-only">{team.rating}</span>
              {formatRating(rating)}
            </p>
          )}
          {instagram && (
            // Negative margins keep the 44px touch target without making the row taller.
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram — ${name}`}
              className="relative z-10 -my-3 -mr-3 flex h-11 w-11 items-center justify-center rounded text-concrete transition-colors duration-300 hover:text-text"
            >
              <InstagramIcon />
            </a>
          )}
        </div>
      </div>

      {/* Drawn as a button so it reads as one; the click is the name button's, stretched over the card. */}
      <span className="mt-4 flex min-h-11 items-center justify-between gap-2 whitespace-nowrap rounded border border-edge px-4 text-xs font-bold uppercase tracking-heading text-text transition-colors duration-300 group-hover:border-text group-hover:bg-text group-hover:text-bg">
        {team.profile}
        <ArrowIcon />
      </span>
    </Reveal>
  );
}
