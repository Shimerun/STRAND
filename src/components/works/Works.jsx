import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { hoverLift } from '../../lib/motion.js';
import ArrowIcon from '../ArrowIcon.jsx';
import Button from '../Button.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';
import PhotoReveal from '../PhotoReveal.jsx';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import StripArrows from '../StripArrows.jsx';
import Lightbox from './Lightbox.jsx';
import { useWorksGL } from './useWorksGL.js';

// three.js and R3F: loaded only where WebGL is on and only once the strip comes near the screen.
const WorksGL = lazy(() => import('./gl/WorksGL.jsx'));

const STRIP_ID = 'works-strip';
const PHOTO_SIZE = { width: 1200, height: 1500 };
// A filmstrip of even 4:5 frames (photos are cropped to fit), six works and then a button for the rest; the
// lightbox still pages through all of them.
const LIMIT = 6;
const FRAME = 'aspect-[4/5] rounded';
// Each photo opens from the right as the strip comes into view, so the row unfolds the way it scrolls.
const FROM = 'right';
const barberName = (slug) => site.team.find((member) => member.slug === slug)?.name ?? null;

/**
 * The works as a sideways strip under a heading that stays put: native swipe with snapping (the next photo peeks
 * in at the edge), a trackpad's sideways scroll, and arrows for a mouse or keyboard. Each photo opens the
 * lightbox, which hands focus back to it and leaves the strip where it was.
 */
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
  const { works, social, ui } = site;
  const gl = useWorksGL(listRef, works.length > 0);
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded && works.length > LIMIT;
  const shown = collapsed ? works.slice(0, LIMIT) : works;

  // The button goes away once pressed, so focus moves on to the first work it brought in, and the strip to it.
  useEffect(() => {
    const item = expanded ? listRef.current?.children[LIMIT] : null;
    if (!item) return;
    item.querySelector('button')?.focus({ preventScroll: true });
    item.scrollIntoView({ block: 'nearest', inline: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [expanded, reduce]);

  return (
    <Section id="works">
      <div className="flex items-end justify-between gap-4">
        <SectionTitle>{ui.sections.works}</SectionTitle>
        <StripArrows rowRef={listRef} rowId={STRIP_ID} />
      </div>

      {/* Bleeds to the screen edges (works-strip in index.css past the content width), so the next photo runs off
          the edge, and the WebGL planes, drawn over the whole screen, never show past the strip's own edges. */}
      <ul
        ref={listRef}
        id={STRIP_ID}
        className="works-strip -ml-5 -mr-[var(--gutter)] mt-8 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto overscroll-x-contain pb-2 pl-5 pr-[var(--gutter)] pt-1 [scrollbar-width:none] md:mt-10 md:gap-6"
      >
        {works.length === 0
          ? // TODO: fill site.works with real photos; placeholders until then.
            Array.from({ length: LIMIT }, (_, index) => (
              <li key={index} aria-hidden="true" className="w-[80%] shrink-0 snap-start sm:w-[45%] md:w-[38%] lg:w-[30%]">
                <PhotoReveal from={FROM} openBy="inView" width={4} height={5} className={FRAME} />
              </li>
            ))
          : shown.map((work, index) => {
              const author = barberName(work.barber);
              return (
                <li key={work.src} className="w-[80%] shrink-0 snap-start sm:w-[45%] md:w-[38%] lg:w-[30%]">
                  <motion.button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setOpenIndex(index)}
                    whileHover={reduce ? undefined : hoverLift}
                    className="block w-full rounded"
                  >
                    {/* The frame the WebGL plane follows; it hides this DOM photo while it draws it (gl/WorkPlane.jsx). */}
                    <div ref={gl.register(index)} data-from={FROM}>
                      <PhotoReveal
                        from={FROM}
                        openBy="inView"
                        src={assetUrl(work.src)}
                        // Phones take the 600px copy where it is enough; from md the full photo, which the WebGL
                        // layer loads anyway, so a desktop never downloads both.
                        srcSet={work.thumb ? `${assetUrl(work.thumb)} 600w, ${assetUrl(work.src)} ${work.width}w` : undefined}
                        sizes={work.thumb ? `(min-width: 768px) ${work.width}px, 80vw` : undefined}
                        alt={work.alt}
                        width={work.width ?? PHOTO_SIZE.width}
                        height={work.height ?? PHOTO_SIZE.height}
                        className={FRAME}
                      />
                    </div>
                  </motion.button>
                  {author && <p className="mt-3 text-sm font-medium text-concrete">{author}</p>}
                </li>
              );
            })}
      </ul>

      {collapsed && (
        <Button variant="ghost" onClick={() => setExpanded(true)} className="mt-6 w-full">
          {ui.works.showAll}
          <span className="tabular-nums text-concrete">{works.length}</span>
        </Button>
      )}

      {social.instagram && (
        <Reveal className="mt-6 md:mt-8">
          <Button variant="link" href={social.instagram} target="_blank" rel="noopener noreferrer">
            {ui.cta.moreWorks}
            <ArrowIcon className="transition-transform duration-150 motion-safe:group-hover:translate-x-1" />
          </Button>
        </Reveal>
      )}

      {gl.active && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            {/* Only the works shown: a plane mounted before its frame exists never hides that photo later. */}
            <WorksGL works={shown} frames={gl.frames} running={gl.near} onLost={gl.disable} />
          </Suspense>
        </ErrorBoundary>
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
    </Section>
  );
}
