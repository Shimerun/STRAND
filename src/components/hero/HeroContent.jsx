import { motion } from 'framer-motion';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { phoneOnly } from '../../lib/booking.js';
import { scrollToId } from '../../lib/scroll.js';
import { EVENTS } from '../../lib/track.js';
import BookButton from '../BookButton.jsx';
import Button from '../Button.jsx';
import Img from '../Img.jsx';
import OpenBadge from '../OpenBadge.jsx';
import PhoneIcon from '../PhoneIcon.jsx';
import Reveal from '../Reveal.jsx';

const SERVICES_ID = 'services';
const TAGLINE =
  'mt-5 text-balance text-[2.25rem] font-extrabold uppercase leading-[1.05] tracking-heading sm:text-6xl sm:leading-[1.02] xl:text-7xl';

/**
 * Photo, headline and calls to action of the first screen. parallaxY: motion value for the photo shift
 * (none under reduced motion). copy: the duplicate drawn for the lower half of the cut, kept out of the
 * accessibility tree by its parent, so it carries no h1 and no alt text. Its buttons still take clicks (the
 * top piece is clipped away under them while the flap sags) but are left out of the tab order.
 * ownCta marks the buttons data-own-cta, which keeps the mobile bar away while they are on screen; during the cut
 * Hero.jsx marks a stand-in instead, since clipped and fallen buttons still count as on screen for an observer.
 */
export default function HeroContent({ parallaxY, copy = false, ownCta = true }) {
  const { cta, hero } = site.ui;
  const tabIndex = copy ? -1 : undefined;

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Oversized to 120% so the parallax shift never reveals a gap. */}
      <motion.div
        className={`absolute inset-x-0 top-0 h-[120%] ${parallaxY ? 'will-change-transform' : ''}`}
        style={parallaxY ? { y: parallaxY } : undefined}
      >
        <Img src={assetUrl(site.images.hero)} alt={copy ? '' : site.ui.alt.hero} width={1600} height={1067} priority className="h-full w-full object-cover" />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/40 to-bg" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col pb-10 pl-5 pr-[var(--gutter)] pt-28 lg:justify-center lg:pb-16">
        <div className="lg:w-1/2">
          <OpenBadge />
          {/* The copy is only seen once the cut starts, long after the reveal, so it is drawn revealed. */}
          {copy ? (
            <p className={TAGLINE}>{site.tagline}</p>
          ) : (
            <Reveal as="h1" className={TAGLINE}>
              {site.tagline}
            </Reveal>
          )}
        </div>

        {/* Room for the shears under the headline on mobile (less on short screens, so the address and the main action
            still fit the first screen at 320x568); on desktop they take the right half. */}
        <div aria-hidden="true" className="min-h-[12svh] flex-1 lg:hidden [@media(min-height:700px)]:min-h-[22svh]" />

        <div className="lg:mt-8 lg:w-1/2">
          <p className="text-sm font-medium uppercase leading-relaxed tracking-heading text-text/80 sm:text-base">
            {hero.subline} · {site.addressShort}
          </p>
          <div data-own-cta={ownCta || undefined} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <BookButton tabIndex={tabIndex} track={{ where: 'hero' }} />
            {/* The call, since the mobile bar that carries it stays away on this screen; beside the second action, so
                the main one keeps its full width and one-line label down to 320px. */}
            <div className="flex gap-3">
              <Button
                tabIndex={tabIndex}
                variant="ghost"
                className="flex-1 !px-3"
                href={`#${SERVICES_ID}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToId(SERVICES_ID);
                }}
              >
                {cta.services}
              </Button>
              {!phoneOnly && (
                <Button
                  tabIndex={tabIndex}
                  variant="ghost"
                  aria-label={cta.call}
                  className="w-12 shrink-0 !px-0 lg:hidden"
                  href={`tel:${site.phone}`}
                  track={{ name: EVENTS.callClick, where: 'hero' }}
                >
                  <PhoneIcon />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
