import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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

const PHOTO_SIZE = { width: 1200, height: 1500 };
// The first LIMIT works walk past in the mirror corridor; the rest come as a grid under it when asked for. Without
// the corridor (reduced motion, no photos yet) it is an even grid of 4:5 frames: LIMIT at first (three rows of two on
// phones, two rows of three from md), then a button for the rest. The lightbox pages through all of them.
const LIMIT = 6;
const FRAME = 'aspect-[4/5] rounded';

export default function Works() {
  const [openIndex, setOpenIndex] = useState(null);
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
    if (profileNext.current) openProfile(profileNext.current);
    profileNext.current = null;
  };
  const reduce = useReducedMotion();
  const listRef = useRef(null);
  const sideOf = useColumnSides(listRef);
  const { works, social, ui } = site;
  const corridor = !reduce && works.length > 0;
  const [expanded, setExpanded] = useState(false);
  const more = !expanded && works.length > LIMIT;
  // The grid's first work is works[start].
  const start = corridor ? LIMIT : 0;
  const grid = corridor ? (expanded ? works.slice(LIMIT) : []) : works.slice(0, more ? LIMIT : undefined);

  // The button goes away once pressed, so focus moves on to the first work it brought in.
  useEffect(() => {
    if (expanded) listRef.current?.children[LIMIT - start]?.querySelector('button')?.focus({ preventScroll: true });
  }, [expanded, start]);

  const title = <SectionTitle>{ui.sections.works}</SectionTitle>;
  const rest = (
    <>
      <ul ref={listRef} className={`grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 ${grid.length || !works.length ? 'mt-10' : ''}`}>
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
                    onClick={() => setOpenIndex(start + index)}
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

      {more && (
        <Button variant="ghost" onClick={() => setExpanded(true)} className="mt-6 w-full">
          {ui.works.showAll}
          <span className="tabular-nums text-concrete">{works.length}</span>
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
            <Lightbox works={works} index={openIndex} onIndexChange={setOpenIndex} onClose={close} onProfile={toProfile} />
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
      <Corridor works={works.slice(0, LIMIT)} title={title} onOpen={setOpenIndex} />
      <div className="mx-auto max-w-6xl pl-5 pr-[var(--gutter)]">{rest}</div>
    </section>
  );
}
