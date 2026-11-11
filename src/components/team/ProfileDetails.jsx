import { site } from '../../data/site.js';
import { formatDuration, formatPrice, formatRating } from '../../lib/format.js';
import { priceFor, servicesFor } from '../../lib/pricing.js';
import { EVENTS } from '../../lib/track.js';
import Button from '../Button.jsx';
import InstagramIcon from '../InstagramIcon.jsx';
import StarIcon from '../StarIcon.jsx';
import ProfileWorks from './ProfileWorks.jsx';

const LABEL = 'text-xs font-medium tracking-heading text-concrete';

// "@name" from an Instagram profile URL; null when the URL cannot be read.
function handleOf(url) {
  try {
    const handle = new URL(url).pathname.replace(/\//g, '');
    return handle ? `@${handle}` : null;
  } catch {
    return null;
  }
}

/** Text column of a barber's profile: name, rating, Instagram, their works and their price list. */
export default function ProfileDetails({ barber, titleId, onBook }) {
  const { slug, name, role, rating, instagram } = barber;
  const { cta, team } = site.ui;
  const works = site.works.filter((work) => work.barber === slug);

  return (
    <div>
      <p className={`uppercase ${LABEL}`}>{role}</p>
      <h2 id={titleId} className="mt-2 text-balance text-3xl leading-tight sm:text-4xl">
        {name}
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {rating != null && (
          <p className="flex items-center gap-1.5 font-bold">
            <StarIcon />
            <span className="sr-only">{team.rating}</span>
            {formatRating(rating)}
          </p>
        )}
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2 text-concrete transition-colors duration-300 hover:text-text"
          >
            <InstagramIcon />
            {handleOf(instagram) ?? 'Instagram'}
          </a>
        )}
      </div>

      {works.length > 0 && (
        <section aria-label={team.works} className="mt-10">
          <ProfileWorks works={works} heading={<h3 className={LABEL}>{team.works}</h3>} />
        </section>
      )}

      <section aria-label={team.prices} className="mt-10">
        <h3 className={LABEL}>{team.prices}</h3>
        <ul className="mt-3 border-t border-line">
          {servicesFor(slug).map((service) => (
            <li key={service.id} className="flex items-start justify-between gap-4 border-b border-line py-4">
              <div className="min-w-0">
                <p className="text-sm font-bold">{service.name}</p>
                <p className="mt-1 text-xs text-concrete">{formatDuration(service.durationMin)}</p>
                {service.note && <p className="mt-1 text-xs text-concrete">{service.note}</p>}
              </div>
              <p className="shrink-0 text-sm font-bold">{formatPrice(priceFor(service.id, slug), { from: service.from === true })}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* On phones the call to action is the sticky bar in BarberProfile instead. */}
      <Button className="mt-8 hidden w-full lg:inline-flex" track={{ name: EVENTS.bookClick, where: 'profile', barber: slug }} onClick={onBook}>
        {cta.bookWithBarber}
      </Button>
    </div>
  );
}
