import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { site } from '../data/site.js';
import { BOOKING_ID, TOP_ID, scrollToId } from '../lib/scroll.js';
import { EVENTS } from '../lib/track.js';
import Button from './Button.jsx';
import Img from './Img.jsx';
import OpenBadge from './OpenBadge.jsx';
import Reveal from './Reveal.jsx';

export default function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const { cta, hero } = site.ui;

  return (
    <section ref={ref} id={TOP_ID} className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Oversized to 120% so the parallax shift never reveals a gap. */}
      <motion.div className="absolute inset-x-0 top-0 h-[120%]" style={reduce ? undefined : { y }}>
        <Img src={site.images.hero} alt="" width={1600} height={1067} priority className="h-full w-full object-cover" />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/40 to-bg" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col pb-10 pl-5 pr-[var(--gutter)] pt-28 lg:justify-center lg:pb-16">
        <div className="lg:w-1/2">
          <OpenBadge />
          <Reveal as="h1" className="mt-5 text-balance text-[1.75rem] leading-[1.1] sm:text-5xl sm:leading-[1.08]">
            {site.tagline}
          </Reveal>
        </div>

        {/* TODO: scissors area (Stage 1b) — under the headline on mobile, the right half on desktop. */}
        <div aria-hidden="true" className="min-h-[22svh] flex-1 lg:hidden" />

        <div className="lg:mt-8 lg:w-1/2">
          <p className="text-xs font-medium uppercase tracking-heading text-concrete sm:text-sm">
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
    </section>
  );
}
