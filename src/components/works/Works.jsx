import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { hoverLift } from '../../lib/motion.js';
import ArrowIcon from '../ArrowIcon.jsx';
import Button from '../Button.jsx';
import PhotoReveal from '../PhotoReveal.jsx';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import Corridor from './Corridor.jsx';
import Lightbox from './Lightbox.jsx';
import { useColumnSides } from './useColumnSides.js';
import { usePrefersReducedMotion } from '../../lib/useMediaQuery.js';

const PHOTO_SIZE = { width: 1200, height: 1500 };
// The first LIMIT works walk past in the mirror corridor; the rest come as a grid under it when asked for. Without
// the corridor (reduced motion, no photos yet) it is an even grid of 4:5 frames: LIMIT at first (three rows of two on
// phones, two rows of three from md), then a button for the rest. The lightbox pages through all of them.
const LIMIT = 6;
const FRAME = 'aspect-[4/5] rounded';

export default function Works() {
  const [openIndex, setOpenIndex] = useState(null);
  // The work that opened the lightbox: focus goes back to it, or on to the profile opened from it.
  const opener = useRef(null);
  const open = useCallback((index, el) => {
    opener.current = el ?? null;
    setOpenIndex(index);
  }, []);
  const close = useCallback(() => setOpenIndex(null), []);
  const { openProfile } = useBooking();
  // A work's "barber's profile" opens it only once the lightbox has gone: its exit hands focus back to the work,
  // and the profile then returns focus there when it closes.
  const profileNext = useRef(null);
  const toProfile = useCallback(
    (slug) => {
      profileNext.current = slug;
      close();
    },
    [close],
  );
  const afterLightbox = () => {
    if (profileNext.current) openProfile(profileNext.current, opener.current);
    profileNext.current = null;
  };
  const reduce = usePrefersReducedMotion();
  const listRef = useRef(null);
  const sideOf = useColumnSides(listRef);
  const { works, social, ui } = site;
  const corridor = !reduce && works.length > 0;
  const [expanded, setExpanded] = useState(false);
  // The grid's first work is works[start].
  const start = corridor ? LIMIT : 0;
  const grid = works.slice(start, expanded ? undefined : LIMIT);

  // Move focus to the first added work so keyboard users can explore the expanded grid.
  useEffect(() => {
    if (expanded) listRef.current?.children[LIMIT - start]?.querySelector('button')?.focus({ preventScroll: true });
  }, [expanded, start]);

  const toggleWorks = (event) => {
    setExpanded(!expanded);
    if (expanded) {
      const button = event.currentTarget;
      button.focus({ preventScroll: true });
      // The button moves when the extra rows disappear.
      requestAnimationFrame(() => button.scrollIntoView({ block: 'nearest' }));
    }
  };

  const title = <SectionTitle>{ui.sections.works}</SectionTitle>;
  const rest = (
    <>
      <ul id="works-grid" ref={listRef} className={`grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 ${grid.length || !works.length ? 'mt-10' : ''}`}>
        {works.length === 0
          ? // TODO: fill site.works with real photos; placeholders until then.
            Array.from({ length: LIMIT }, (_, index) => {
              const from = sideOf(index);
              return (
                <li key={index} aria-hidden="true">
                  <PhotoReveal key={from} from={from} openBy="inView" width={4} height={5} className={FRAME} />
                </li>
              );
            })
          : grid.map((work, index) => {
              const from = sideOf(index);
              return (
                <li key={work.src}>
                  <motion.button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(event) => open(start + index, event.currentTarget)}
                    whileHover={reduce ? undefined : hoverLift}
                    className="block w-full rounded"
                  >
                    {/* Keyed by side: the column is known only after layout, and the clip is set up once per mount. */}
                    <PhotoReveal
                      key={from}
                      from={from}
                      openBy="inView"
                      src={assetUrl(work.src)}
                      // Phones (two columns) take the 600px copy, md and up the full photo.
                      srcSet={work.thumb ? `${assetUrl(work.thumb)} 600w, ${assetUrl(work.src)} ${work.width}w` : undefined}
                      sizes={work.thumb ? `(min-width: 768px) ${work.width}px, 50vw` : undefined}
                      alt={work.alt}
                      width={work.width ?? PHOTO_SIZE.width}
                      height={work.height ?? PHOTO_SIZE.height}
                      className={FRAME}
                    />
                  </motion.button>
                </li>
              );
            })}
      </ul>

      {works.length > LIMIT && (
        <Button
          variant="ghost"
          aria-expanded={expanded}
          aria-controls="works-grid"
          onClick={toggleWorks}
          className="mt-6 w-full"
        >
          {expanded ? ui.works.collapse : ui.works.showAll}
          {!expanded && <span className="tabular-nums text-concrete">{works.length}</span>}
        </Button>
      )}

      {social.instagram && (
        <Reveal className="mt-6 md:mt-8">
          <Button variant="link" href={social.instagram} target="_blank" rel="noopener noreferrer">
            {ui.cta.moreWorks}
            <ArrowIcon className="transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
          </Button>
        </Reveal>
      )}

      {/* Portaled so transformed ancestors never become the lightbox's containing block. */}
      {createPortal(
        <AnimatePresence onExitComplete={afterLightbox}>
          {openIndex !== null && (
            <Lightbox works={works} index={openIndex} onIndexChange={setOpenIndex} onClose={close} onProfile={toProfile} opener={opener.current} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );

  if (!corridor) {
    return (
      <Section id="works">
        {title}
        {rest}
      </Section>
    );
  }

  // Section's band, without its padded box: the corridor spans the whole screen.
  return (
    <section id="works" className="band relative scroll-mt-header pb-20 md:pb-28">
      <div aria-hidden="true" className="band-bg" />
      <Corridor works={works.slice(0, LIMIT)} title={title} onOpen={open} />
      <div className="mx-auto max-w-6xl pl-5 pr-[var(--gutter)]">{rest}</div>
    </section>
  );
}
