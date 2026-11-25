import { site } from '../data/site.js';
import { formatHours } from '../lib/format.js';
import { kyivNow } from '../lib/time.js';
import { EVENTS } from '../lib/track.js';
import ArrowIcon from './ArrowIcon.jsx';
import Button from './Button.jsx';
import PhoneLink from './PhoneLink.jsx';
import Reveal from './Reveal.jsx';
import Section from './Section.jsx';
import SectionTitle from './SectionTitle.jsx';

// Name and address, not coordinates: Google then opens the barbershop's own card (name, reviews, hours) instead of
// a bare pin. Checked 2026-11-25: this query resolves to the "Strand Барбершоп" card.
const PLACE = encodeURIComponent(`${site.name} ${site.ui.brand.sub}, ${site.address}`);
const MAP_EMBED_URL = `https://www.google.com/maps?q=${PLACE}&output=embed`;
// Google Maps URLs API: `dir` starts a route to the place (from wherever the visitor is), `search` shows it.
export const ROUTE_URL = `https://www.google.com/maps/dir/?api=1&destination=${PLACE}`;
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${PLACE}`;
const TERM = 'text-xs font-medium uppercase tracking-heading text-concrete';

// Rows of the hours table: one "every day" row while all days share the hours, otherwise a row per day.
function hoursRows({ closed, everyDay, days }) {
  const rows = Object.entries(site.hours).map(([key, hours]) => ({ key, label: days[key], hours: formatHours(hours, closed) }));
  const same = rows.every((row) => row.hours === rows[0].hours);
  return same ? [{ key: 'every-day', label: everyDay, hours: rows[0].hours }] : rows;
}

export default function Contacts() {
  const { contacts, cta, sections } = site.ui;
  const today = kyivNow().weekday;
  const rows = hoursRows(contacts);

  return (
    <Section id="contacts" tone="surface">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionTitle>{sections.contacts}</SectionTitle>

          <Reveal as="dl" className="mt-8 space-y-6">
            <div>
              <dt className={TERM}>{contacts.address}</dt>
              <dd className="mt-1 text-lg">{site.address}</dd>
            </div>
            <div>
              <dt className={TERM}>{contacts.phone}</dt>
              <dd className="mt-1">
                <PhoneLink
                  where="contacts"
                  className="relative text-lg font-bold transition-colors duration-300 before:absolute before:inset-x-0 before:-inset-y-3 hover:text-concrete"
                />
              </dd>
            </div>
          </Reveal>

          <Reveal className="mt-8">
            <h3 className={TERM}>{contacts.hours}</h3>
            <table className="mt-3 w-full max-w-sm text-sm">
              <tbody>
                {rows.map(({ key, label, hours }) => {
                  const isToday = key === today;
                  // A single "every day" row holds today's hours too, so it reads like today's row.
                  const strong = isToday || rows.length === 1;
                  return (
                    <tr
                      key={key}
                      aria-current={isToday ? 'date' : undefined}
                      className={`border-b border-line ${strong ? 'font-bold text-text' : 'text-concrete'}`}
                    >
                      <th scope="row" className="py-2.5 text-left font-[inherit]">
                        {label}
                        {isToday && (
                          <span className="ml-2 rounded border border-accent px-1.5 py-0.5 text-xs uppercase tracking-heading text-text">
                            {contacts.today}
                          </span>
                        )}
                      </th>
                      <td className="py-2.5 text-right tabular-nums">{hours}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Reveal>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
            <Button
              variant="ghost"
              href={ROUTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              track={{ name: EVENTS.routeClick, where: 'contacts' }}
            >
              {cta.route}
            </Button>
            <Button variant="link" href={MAP_URL} target="_blank" rel="noopener noreferrer">
              {cta.openMap}
              <ArrowIcon className="-rotate-45" />
            </Button>
          </div>
        </div>

        <div className="min-h-[320px] overflow-hidden rounded border border-line bg-bg">
          <iframe
            src={MAP_EMBED_URL}
            title={contacts.map}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full min-h-[320px] w-full [filter:grayscale(1)_invert(0.92)_contrast(0.9)]"
          />
        </div>
      </div>
    </Section>
  );
}
