import { motion } from 'framer-motion';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { scrollToId } from '../../lib/scroll.js';
import BookButton from '../BookButton.jsx';
import Button from '../Button.jsx';
import Img from '../Img.jsx';
import OpenBadge from '../OpenBadge.jsx';
import Reveal from '../Reveal.jsx';

const SERVICES_ID = 'services';
const TAGLINE =
  'mt-5 text-balance text-[2.25rem] font-extrabold uppercase leading-[1.05] tracking-heading sm:text-6xl sm:leading-[1.02] xl:text-7xl';

/**
 * Photo, headline and calls to action of the first screen. parallaxY: motion value for the photo shift
 * (none under reduced motion). The buttons are marked data-own-cta, which keeps the mobile bar away while they
 * are on screen.
 */
export default function HeroContent({ parallaxY }) {
  const { cta, hero } = site.ui;

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Oversized to 120% so the parallax shift never reveals a gap. */}
      <motion.div
        className={`absolute inset-x-0 top-0 h-[120%] ${parallaxY ? 'will-change-transform' : ''}`}
        style={parallaxY ? { y: parallaxY } : undefined}
      >
        <Img src={assetUrl(site.images.hero)} alt={site.ui.alt.hero} width={1600} height={1067} priority className="h-full w-full object-cover" />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/40 to-bg" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col pb-10 pl-5 pr-[var(--gutter)] pt-24 lg:justify-center lg:pb-16 [@media(min-height:600px)]:pt-28">
        <div className="lg:w-1/2">
          <OpenBadge />
          <Reveal as="h1" className={TAGLINE}>
            {site.tagline}
          </Reveal>
        </div>

        {/* Room for the shears under the headline on mobile, less on short screens: the frame is pinned, so whatever
            falls below the first screen (at 320x568, the second button) could never be seen or focused while it is.
            On desktop the shears take the right half. */}
        <div aria-hidden="true" className="flex-1 lg:hidden [@media(min-height:600px)]:min-h-[12svh] [@media(min-height:700px)]:min-h-[22svh]" />

        <div className="lg:mt-8 lg:w-1/2">
          <p className="text-sm font-medium uppercase leading-relaxed tracking-heading text-text/80 sm:text-base">
            {hero.subline} · {site.addressShort}
          </p>
          <div data-own-cta className="mt-6 flex flex-col gap-3 sm:flex-row">
            <BookButton track={{ where: 'hero' }} />
            <Button
              variant="ghost"
              href={`#${SERVICES_ID}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToId(SERVICES_ID);
              }}
            >
              {cta.services}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
