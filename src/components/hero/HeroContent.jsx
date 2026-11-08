import { motion } from 'framer-motion';
import { site } from '../../data/site.js';
import { BOOKING_ID, scrollToId } from '../../lib/scroll.js';
import { EVENTS } from '../../lib/track.js';
import Button from '../Button.jsx';
import Img from '../Img.jsx';
import OpenBadge from '../OpenBadge.jsx';
import Reveal from '../Reveal.jsx';

/**
 * Photo, headline and calls to action of the first screen. parallaxY: motion value for the photo shift
 * (none under reduced motion). copy: the duplicate drawn for the lower half of the cut, kept out of the
 * accessibility tree by its parent, so it carries no h1 and no alt text.
 */
export default function HeroContent({ parallaxY, copy = false }) {
  const { cta, hero } = site.ui;

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Oversized to 120% so the parallax shift never reveals a gap. */}
      <motion.div className="absolute inset-x-0 top-0 h-[120%]" style={parallaxY ? { y: parallaxY } : undefined}>
        <Img src={site.images.hero} alt={copy ? '' : site.ui.alt.hero} width={1600} height={1067} priority className="h-full w-full object-cover" />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/40 to-bg" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col pb-10 pl-5 pr-[var(--gutter)] pt-28 lg:justify-center lg:pb-16">
        <div className="lg:w-1/2">
          <OpenBadge />
          <Reveal as={copy ? 'p' : 'h1'} className="mt-5 text-balance text-[2.25rem] font-extrabold uppercase leading-[1.05] tracking-heading sm:text-6xl sm:leading-[1.02] xl:text-7xl">
            {site.tagline}
          </Reveal>
        </div>

        {/* Room for the shears under the headline on mobile; on desktop they take the right half. */}
        <div aria-hidden="true" className="min-h-[22svh] flex-1 lg:hidden" />

        <div className="lg:mt-8 lg:w-1/2">
          <p className="text-sm font-medium uppercase leading-relaxed tracking-heading text-text/80 sm:text-base">
            {hero.subline} · {site.addressShort}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button track={{ name: EVENTS.bookClick, where: 'hero' }} onClick={() => scrollToId(BOOKING_ID)}>
              {cta.book}
            </Button>
            <Button variant="ghost" href={`tel:${site.phone}`} track={{ name: EVENTS.callClick, where: 'hero' }}>
              {cta.call}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
