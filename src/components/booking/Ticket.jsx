import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { site } from '../../data/site.js';
import { formatLongDay, formatPrice } from '../../lib/format.js';
import { EVENTS } from '../../lib/track.js';
import ArrowIcon from '../ArrowIcon.jsx';
import Button from '../Button.jsx';
import { ROUTE_URL } from '../Contacts.jsx';
import TicketSnip from './TicketSnip.jsx';
import { usePrefersReducedMotion } from '../../lib/useMediaQuery.js';

const STUB_FALL = { y: 140, rotate: 7, opacity: 0, transition: { duration: 0.7, ease: [0.4, 0, 1, 1] } };
const NOTCH = 'absolute top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-surface';

/**
 * Booking receipt shown after a successful request: date, time, barber, services and total. The shears cut
 * the stub off along the perforation and it drops away. Reduced motion: shown already torn off, no shears.
 * `booked` is a copy taken at submit, so later picks elsewhere on the page or live prices cannot change it.
 */
export default function Ticket({ booked }) {
  const reduce = usePrefersReducedMotion();
  const { summary, ticket } = site.ui.form;
  const [stage, setStage] = useState(reduce ? 'done' : 'cut'); // cut → fall → done
  const [width, setWidth] = useState(0);
  const perforationRef = useRef(null);
  const toFall = useCallback(() => setStage('fall'), []);

  useLayoutEffect(() => setWidth(perforationRef.current?.offsetWidth ?? 0), []);

  const { date, time, barber, services, price } = booked;
  const rows = [
    [summary.barber, barber],
    [summary.services, services],
    [summary.total, price ? formatPrice(price.value, { from: price.from }) : null],
    // Here, not only on the stub: the stub falls away.
    [site.ui.contacts.address, site.addressShort],
  ].filter(([, value]) => value);

  return (
    <div className="relative mt-8">
      <div className="rounded-t border border-b-0 border-line bg-bg px-6 pb-7 pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-heading text-concrete">{ticket.title}</p>
          <p className="text-xs font-extrabold uppercase tracking-wordmark">{site.name}</p>
        </div>
        <p className="mt-5 text-sm font-bold first-letter:uppercase">{date && formatLongDay(date)}</p>
        <p className="text-5xl font-extrabold tabular-nums leading-none">{time}</p>
        <dl className="mt-6 space-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="shrink-0 text-concrete">{label}</dt>
              <dd className="text-right font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <Button
          variant="link"
          href={ROUTE_URL}
          target="_blank"
          rel="noopener noreferrer"
          track={{ name: EVENTS.routeClick, where: 'ticket' }}
          className="mt-4"
        >
          {site.ui.cta.route}
          <ArrowIcon />
        </Button>
      </div>

      {/* Perforation: dashed tear line with a notch at each end; the shears cut along it. */}
      <div ref={perforationRef} aria-hidden="true" className="relative h-0">
        <div className="cut-perforation absolute inset-x-3 top-0 h-px" />
        <span className={`${NOTCH} -left-3`} />
        <span className={`${NOTCH} -right-3`} />
        {stage === 'cut' && (
          <div className="absolute inset-x-0 top-0 h-0 overflow-x-clip">
            <TicketSnip width={width} onDone={toFall} />
          </div>
        )}
      </div>

      {stage !== 'done' && (
        <motion.div
          aria-hidden="true"
          animate={stage === 'fall' ? STUB_FALL : undefined}
          onAnimationComplete={() => stage === 'fall' && setStage('done')}
          style={{ originX: 0, originY: 0 }}
          className="flex items-center justify-between gap-4 rounded-b border border-t-0 border-line bg-bg px-6 py-4 text-xs uppercase tracking-heading text-concrete"
        >
          <span>{ticket.stub}</span>
          <span>{site.addressShort}</span>
        </motion.div>
      )}
    </div>
  );
}
