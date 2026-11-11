import { site } from '../data/site.js';
import { formatHours } from '../lib/format.js';
import { kyivNow } from '../lib/time.js';
import { EVENTS, track } from '../lib/track.js';
import Button from './Button.jsx';
import Reveal from './Reveal.jsx';
import Section from './Section.jsx';
import SectionTitle from './SectionTitle.jsx';

const { lat, lng } = site.geo;
const MAP_EMBED_URL = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
const ROUTE_URL = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
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
                <a
                  href={`tel:${site.phone}`}
                  onClick={() => track(EVENTS.callClick, { where: 'contacts' })}
                  className="text-lg font-bold transition-colors duration-300 hover:text-concrete"
                >
                  {site.phoneDisplay}
                </a>
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

          <Button
            variant="ghost"
            href={ROUTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            track={{ name: EVENTS.routeClick, where: 'contacts' }}
            className="mt-8"
          >
            {cta.route}
          </Button>
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
