import { lazy, Suspense, useCallback, useRef, useState } from 'react';
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
import { useColumnDrift } from './useColumnDrift.js';
import { useWorksGL } from './useWorksGL.js';

// three.js and R3F: loaded only where WebGL is on and only once the grid comes near the screen.
const WorksGL = lazy(() => import('./gl/WorksGL.jsx'));

// Varied ratios keep the masonry rhythm while real photos are missing.
const PLACEHOLDER_RATIOS = [
  [4, 5],
  [1, 1],
  [3, 4],
  [1, 1],
  [4, 5],
  [3, 4],
];
const PHOTO_SIZE = { width: 1200, height: 1500 };
const ITEM = 'mb-4 break-inside-avoid md:mb-6';

export default function Works() {
  const [openIndex, setOpenIndex] = useState(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const reduce = useReducedMotion();
  const listRef = useRef(null);
  const column = useColumnDrift(listRef);
  const { works, social, ui } = site;
  const gl = useWorksGL(listRef, works.length > 0);

  return (
    <Section id="works">
      <SectionTitle>{ui.sections.works}</SectionTitle>

      <ul ref={listRef} className="mt-10 columns-2 gap-4 md:columns-3 md:gap-6">
        {works.length === 0
          ? // TODO: fill site.works with real photos; placeholders until then.
            PLACEHOLDER_RATIOS.map(([width, height], index) => {
              const { y, from } = column(index);
              return (
                <motion.li key={index} aria-hidden="true" style={reduce ? undefined : { y }} className={ITEM}>
                  <PhotoReveal key={from} from={from} width={width} height={height} className="rounded" />
                </motion.li>
              );
            })
          : works.map((work, index) => {
              const { y, from } = column(index);
              return (
                <motion.li key={work.src} style={reduce ? undefined : { y }} className={ITEM}>
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
                        src={assetUrl(work.src)}
                        alt={work.alt}
                        width={work.width ?? PHOTO_SIZE.width}
                        height={work.height ?? PHOTO_SIZE.height}
                        className="rounded"
                      />
                    </div>
                  </motion.button>
                </motion.li>
              );
            })}
      </ul>

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
            <WorksGL works={works} frames={gl.frames} running={gl.near} onLost={gl.disable} />
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
