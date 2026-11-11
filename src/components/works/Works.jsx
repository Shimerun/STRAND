import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { hoverLift } from '../../lib/motion.js';
import Button from '../Button.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';
import PhotoReveal from '../PhotoReveal.jsx';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import Lightbox from './Lightbox.jsx';
import { useColumnSides } from './useColumnSides.js';
import { useWorksGL } from './useWorksGL.js';

// three.js and R3F: loaded only where WebGL is on and only once the grid comes near the screen.
const WorksGL = lazy(() => import('./gl/WorksGL.jsx'));

const PHOTO_SIZE = { width: 1200, height: 1500 };
// An even grid of 4:5 frames (photos are cropped to fit): six works, three rows of two on phones and two rows
// of three from md, then a button for the rest. The lightbox still pages through all of them.
const LIMIT = 6;
const FRAME = 'aspect-[4/5] rounded';

export default function Works() {
  const [openIndex, setOpenIndex] = useState(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const reduce = useReducedMotion();
  const listRef = useRef(null);
  const sideOf = useColumnSides(listRef);
  const { works, social, ui } = site;
  const gl = useWorksGL(listRef, works.length > 0);
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded && works.length > LIMIT;
  const shown = collapsed ? works.slice(0, LIMIT) : works;

  // The button goes away once pressed, so focus moves on to the first work it brought in.
  useEffect(() => {
    if (expanded) listRef.current?.children[LIMIT]?.querySelector('button')?.focus({ preventScroll: true });
  }, [expanded]);

  return (
    <Section id="works">
      <SectionTitle>{ui.sections.works}</SectionTitle>

      <ul ref={listRef} className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
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
          : shown.map((work, index) => {
              const from = sideOf(index);
              return (
                <li key={work.src}>
                  <motion.button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setOpenIndex(index)}
                    whileHover={reduce ? undefined : hoverLift}
                    className="block w-full rounded"
                  >
                    {/* The frame the WebGL plane follows; it hides this DOM photo while it draws it (gl/WorkPlane.jsx). */}
                    <div ref={gl.register(index)} data-from={from}>
                      {/* Keyed by side: the column is known only after layout, and the clip is set up once per mount. */}
                      <PhotoReveal
                        key={from}
                        from={from}
                        openBy="inView"
                        src={assetUrl(work.src)}
                        // Phones (two columns) take the 600px copy; from md the full photo, which the WebGL
                        // layer loads anyway, so a desktop never downloads both.
                        srcSet={work.thumb ? `${assetUrl(work.thumb)} 600w, ${assetUrl(work.src)} ${work.width}w` : undefined}
                        sizes={work.thumb ? `(min-width: 768px) ${work.width}px, 50vw` : undefined}
                        alt={work.alt}
                        width={work.width ?? PHOTO_SIZE.width}
                        height={work.height ?? PHOTO_SIZE.height}
                        className={FRAME}
                      />
                    </div>
                  </motion.button>
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
          <Button variant="ghost" href={social.instagram} target="_blank" rel="noopener noreferrer">
            {ui.cta.moreWorks}
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
        <AnimatePresence>
          {openIndex !== null && (
            <Lightbox works={works} index={openIndex} onIndexChange={setOpenIndex} onClose={close} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </Section>
  );
}
