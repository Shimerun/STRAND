import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { hoverLift } from '../../lib/motion.js';
import Button from '../Button.jsx';
import PhotoReveal from '../PhotoReveal.jsx';
import Reveal from '../Reveal.jsx';
import Section from '../Section.jsx';
import SectionTitle from '../SectionTitle.jsx';
import Lightbox from './Lightbox.jsx';

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
  const { works, social, ui } = site;

  return (
    <Section id="works">
      <SectionTitle>{ui.sections.works}</SectionTitle>

      <ul className="mt-10 columns-2 gap-4 md:columns-3 md:gap-6">
        {works.length === 0
          ? // TODO: fill site.works with real photos; placeholders until then.
            PLACEHOLDER_RATIOS.map(([width, height], index) => (
              <li key={index} aria-hidden="true" className={ITEM}>
                <PhotoReveal width={width} height={height} className="rounded" />
              </li>
            ))
          : works.map((work, index) => (
              <li key={work.src} className={ITEM}>
                <motion.button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setOpenIndex(index)}
                  whileHover={reduce ? undefined : hoverLift}
                  className="block w-full rounded"
                >
                  <PhotoReveal src={work.src} alt={work.alt} {...PHOTO_SIZE} className="rounded" />
                </motion.button>
              </li>
            ))}
      </ul>

      {social.instagram && (
        <Reveal className="mt-6 md:mt-8">
          <Button variant="ghost" href={social.instagram} target="_blank" rel="noopener noreferrer">
            {ui.cta.moreWorks}
          </Button>
        </Reveal>
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
