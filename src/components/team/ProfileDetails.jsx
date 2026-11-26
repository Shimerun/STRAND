import { site } from '../../data/site.js';
import { bookingEnabled } from '../../lib/booking.js';
import { formatDuration, formatRating, formatServicePrice } from '../../lib/format.js';
import { servicesFor } from '../../lib/pricing.js';
import { EVENTS, track } from '../../lib/track.js';
import ArrowIcon from '../ArrowIcon.jsx';
import BookButton from '../BookButton.jsx';
import InstagramIcon from '../InstagramIcon.jsx';
import StarIcon from '../StarIcon.jsx';
import { initials } from './photo.js';
import ProfileWorks from './ProfileWorks.jsx';

const LABEL = 'text-xs font-medium tracking-heading text-concrete';
const ROW = 'flex w-full items-start justify-between gap-4 py-4 text-left';

// "@name" from an Instagram profile URL; null when the URL cannot be read.
function handleOf(url) {
  try {
    const handle = new URL(url).pathname.replace(/\//g, '');
    return handle ? `@${handle}` : null;
  } catch {
    return null;
  }
}

/**
 * Text column of a barber's profile: name, rating, Instagram, their works and their price list. `monogram`: no
 * portrait, so the initials sit beside the name. Each price row books that service with this barber (while
 * online booking works; otherwise the booking button is the call).
 */
export default function ProfileDetails({ barber, titleId, monogram, onBook }) {
  const { slug, name, role, rating, instagram } = barber;
  const { cta, team } = site.ui;
  const works = site.works.filter((work) => work.barber === slug);

  const bookService = (serviceId) => {
    track(EVENTS.bookClick, { where: 'profile-price', barber: slug, service: serviceId });
    onBook(serviceId);
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        {monogram && (
          <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-edge text-xl font-extrabold text-concrete">
            {initials(name)}
          </span>
        )}
        <div className="min-w-0">
          <p className={`uppercase ${LABEL}`}>{role}</p>
          <h2 id={titleId} className="mt-2 text-balance text-3xl normal-case leading-tight tracking-normal sm:text-4xl">
            {name}
          </h2>
        </div>
      </div>

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
            className="flex min-h-11 items-center gap-2 text-concrete transition-colors duration-150 hover:text-text"
          >
            <InstagramIcon />
            {handleOf(instagram) ?? team.instagram}
          </a>
        )}
      </div>

      {/* On phones the call to action is the sticky bar in BarberProfile instead. */}
      <BookButton
        className="mt-6 hidden w-full lg:inline-flex"
        label={cta.bookWithBarber}
        barber={slug}
        track={{ where: 'profile', barber: slug }}
        onClick={() => onBook()}
      />

      {works.length > 0 && (
        <section aria-label={team.works} className="mt-10">
          <ProfileWorks works={works} heading={<h3 className={LABEL}>{team.works}</h3>} />
        </section>
      )}

      <section aria-label={team.prices} className="mt-10">
        <h3 className={LABEL}>{team.prices}</h3>
        <ul className="mt-3 border-t border-line">
          {servicesFor(slug).map((service) => {
            const content = (
              <>
                <span className="min-w-0">
                  <span className="block font-bold leading-snug">
                    {bookingEnabled && <span className="sr-only">{cta.book}: </span>}
                    {service.name}
                  </span>
                  <span className="mt-1 block text-sm text-concrete">{formatDuration(service.durationMin)}</span>
                  {service.note && <span className="mt-1 block text-sm text-accent-light">{service.note}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-3 font-bold tabular-nums">
                  {formatServicePrice(service, slug)}
                  {bookingEnabled && <ArrowIcon className="text-concrete transition-[transform,color] duration-150 group-hover:translate-x-1 group-hover:text-text" />}
                </span>
              </>
            );
            return (
              <li key={service.id} className="border-b border-line">
                {bookingEnabled ? (
                  <button type="button" onClick={() => bookService(service.id)} className={`group ${ROW}`}>
                    {content}
                  </button>
                ) : (
                  <div className={ROW}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

    </div>
  );
}
