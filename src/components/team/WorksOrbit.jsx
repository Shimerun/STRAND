import { useEffect, useRef, useState } from 'react';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { useMediaQuery } from '../../lib/useMediaQuery.js';
import Img from '../Img.jsx';

const HOVER_DEVICE = '(hover: hover) and (pointer: fine)';
const IN_VIEW = 0.75; // share of the photo on screen (and inside the swipe row) that starts the orbit on touch
const MAX_CARDS = 5;
const START_ANGLE = 60; // deg on the ring: the first card starts in front of the photo, to the right
const STAGGER_MS = 120;

/**
 * Hovering a BarberCard throws up to five of the barber's works out of the portrait onto a ring tilted away from
 * the viewer; they circle the photo, passing behind it and in front of it (motion in index.css, `.works-orbit`;
 * the 3D scene is the wrapper round the photo in BarberCard). Each card sits on an arm turned to its place on
 * the ring; the counter element and the face undo that turn, the spin and the tilt, so every card faces the
 * viewer. With a mouse it runs on hover; on touch screens, while the photo is in view (`data-active`), so it
 * starts when the card is swiped in and stops when it leaves. Decorative: the same works are in the profile and
 * the gallery.
 */
export default function WorksOrbit({ slug }) {
  const hover = useMediaQuery(HOVER_DEVICE);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const works = site.works.filter((work) => work.barber === slug).slice(0, MAX_CARDS);
  const hasWorks = works.length > 0;

  useEffect(() => {
    if (hover || !hasWorks) return undefined;
    // The orbit box has no height, so the photo it circles is what is watched.
    // Not isIntersecting: it stays true while any sliver of the photo shows, e.g. the next card peeking into the row.
    const observer = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= IN_VIEW), { threshold: IN_VIEW });
    observer.observe(ref.current.parentElement);
    return () => {
      observer.disconnect();
      setInView(false);
    };
  }, [hover, hasWorks]);

  if (!hasWorks) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-active={(!hover && inView) || undefined}
      className="works-orbit pointer-events-none absolute left-0 top-[55%] h-0 w-full"
    >
      <div className="works-orbit-spin absolute inset-0">
        {works.map((work, index) => (
          <div
            key={work.src}
            className="works-orbit-arm absolute inset-0"
            style={{
              '--orbit-angle': `${START_ANGLE + (index * 360) / works.length}deg`,
              '--orbit-delay': `${index * STAGGER_MS}ms`,
            }}
          >
            <div className="works-orbit-counter absolute inset-0">
              <div className="works-orbit-face absolute left-1/2 top-0 -ml-[13%] -mt-[16.25%] aspect-[4/5] w-[26%] overflow-hidden rounded border border-text/15 bg-surface shadow-[0_16px_32px_rgba(0,0,0,0.55)]">
                <Img src={assetUrl(work.thumb ?? work.src)} width={work.width} height={work.height} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
