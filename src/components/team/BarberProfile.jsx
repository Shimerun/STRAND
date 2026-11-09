import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { site } from '../../data/site.js';
import { useBooking } from '../../lib/bookingContext.jsx';
import { EASE_REVEAL } from '../../lib/motion.js';
import { unlockScroll } from '../../lib/scroll.js';
import { EVENTS } from '../../lib/track.js';
import { useDialog } from '../../lib/useDialog.js';
import Button from '../Button.jsx';
import Img from '../Img.jsx';
import { barberPhoto, PHOTO_RADIUS, PHOTO_TRANSITION, photoLayoutId } from './photo.js';
import ProfileDetails from './ProfileDetails.jsx';

const backdrop = { duration: 0.4, ease: EASE_REVEAL };
// Everything but the photo comes in once the photo has (nearly) landed and leaves first.
const content = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.5, ease: EASE_REVEAL } },
  exit: { opacity: 0, y: 0, transition: { duration: 0.2, ease: EASE_REVEAL } },
};
const contentProps = { variants: content, initial: 'hidden', animate: 'visible', exit: 'exit' };

/**
 * A barber's page over the site: the card photo morphs into the profile photo (shared layoutId), then the
 * details fade in. Phones: photo, then details, with a sticky booking bar; desktop: the photo stays put on
 * the left while the details scroll. Reduced motion: plain fades, no morph.
 */
export default function BarberProfile({ barber, onClose }) {
  const rootRef = useRef(null);
  const closeRef = useRef(null);
  const reduce = useReducedMotion();
  const onKeyDown = useDialog(rootRef, closeRef, onClose);
  const { openBooking } = useBooking();
  const { cta, team } = site.ui;
  const titleId = `profile-title-${barber.slug}`;

  // Scroll must be unlocked before scrolling: a stopped Lenis ignores scrollTo.
  const book = () => {
    unlockScroll();
    onClose();
    openBooking({ barber: barber.slug });
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <motion.div aria-hidden="true" className="absolute inset-0 bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={backdrop} />

      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        data-lenis-prevent
        className="absolute inset-0 overflow-y-auto overscroll-contain outline-none"
      >
        <div className="flex min-h-full flex-col">
          <motion.div {...contentProps} className="sticky top-0 z-10 flex h-header shrink-0 items-center justify-between bg-bg px-5 lg:px-8">
            <p className="text-xs font-medium uppercase tracking-heading text-concrete">{team.profile}</p>
            <button ref={closeRef} type="button" aria-label={cta.close} onClick={onClose} className="-mr-3 flex h-12 w-12 items-center justify-center rounded">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </motion.div>

          <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-5 pb-10 pt-2 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-16 lg:pt-6">
            <div className="lg:sticky lg:top-[calc(theme(spacing.header)+1.5rem)] lg:self-start">
              <motion.div
                layoutId={reduce ? undefined : photoLayoutId(barber.slug)}
                transition={PHOTO_TRANSITION}
                style={{ borderRadius: PHOTO_RADIUS }}
                className="aspect-[4/5] w-full overflow-hidden bg-surface lg:max-w-[min(100%,calc((100dvh-9rem)*0.8))]"
                {...(reduce ? contentProps : undefined)}
              >
                <Img src={barberPhoto(barber.slug)} alt="" width={800} height={1000} className="h-full w-full object-cover" />
              </motion.div>
            </div>

            <motion.div {...contentProps}>
              <ProfileDetails barber={barber} titleId={titleId} onBook={book} />
            </motion.div>
          </div>

          <motion.div {...contentProps} className="sticky bottom-0 mt-auto border-t border-line bg-bg/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
            <Button className="w-full" track={{ name: EVENTS.bookClick, where: 'profile', barber: barber.slug }} onClick={book}>
              {cta.bookWithBarber}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
