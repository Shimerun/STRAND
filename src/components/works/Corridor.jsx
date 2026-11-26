import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { site } from '../../data/site.js';
import { assetUrl } from '../../lib/assetUrl.js';
import { scrollToY } from '../../lib/scroll.js';
import { useMediaQuery } from '../../lib/useMediaQuery.js';
import Img from '../Img.jsx';
import { CORRIDOR, cameraAt, corridorScreens, focusProgress, framePose } from './corridor.js';

const WIDE = '(min-width: 1024px)';
const VANISH_Y = '56%'; // the corridor's vanishing point, below the middle so the title above has room
const PHOTO_SIZE = { width: 1200, height: 1500 };
const pad = (n) => String(n).padStart(2, '0');

// One work on the wall. Its pose comes from the camera alone (corridor.js); a frame that has faded out lets clicks
// through, and keyboard focus walks the camera to it.
function Frame({ work, index, count, camera, width, look, onOpen, onFocusFrame }) {
  const pose = useTransform([camera, width], ([cam, w]) => framePose(index, cam, w, look));
  const opacity = useTransform(pose, (p) => p.opacity);

  return (
    <motion.button
      type="button"
      aria-haspopup="dialog"
      onClick={(event) => onOpen(index, event.currentTarget)}
      onFocus={(event) => event.currentTarget.matches(':focus-visible') && onFocusFrame(index)}
      style={{
        transform: useTransform(pose, (p) => p.transform),
        opacity,
        zIndex: count - index, // nearer frames over farther ones (no 3D context sorts them)
        pointerEvents: useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none')),
        top: VANISH_Y,
      }}
      className="group absolute left-1/2 aspect-[4/5] w-[68vw] overflow-hidden rounded bg-surface will-change-transform lg:h-[60svh] lg:w-auto"
    >
      <Img
        src={assetUrl(work.src)}
        srcSet={work.thumb ? `${assetUrl(work.thumb)} 600w, ${assetUrl(work.src)} ${work.width ?? PHOTO_SIZE.width}w` : undefined}
        sizes="(min-width: 1024px) 48svh, 68vw"
        alt={work.alt}
        width={work.width ?? PHOTO_SIZE.width}
        height={work.height ?? PHOTO_SIZE.height}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      {/* The dark of the far end of the corridor; a layer of its own, so it fades without repainting the photo. */}
      <motion.span aria-hidden="true" style={{ opacity: useTransform(pose, (p) => p.fog), willChange: 'opacity' }} className="absolute inset-0 bg-bg" />
    </motion.button>
  );
}

/**
 * The works as a corridor of facing mirrors (corridor.js): pinned for a few screens while the camera walks down it,
 * each work turning to face the viewer as it comes level, then passing to its side. A counter names the work in
 * front and its barber. title: the section heading, shown above the corridor. onOpen(index, opener): open that work.
 */
export default function Corridor({ works, title, onOpen }) {
  const pinRef = useRef(null);
  const stageRef = useRef(null);
  const wide = useMediaQuery(WIDE);
  const look = wide ? CORRIDOR.desktop : CORRIDOR.mobile;
  const n = works.length;
  const screens = corridorScreens(n, wide ? CORRIDOR.beat.desktop : CORRIDOR.beat.mobile);
  const width = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ['start start', 'end end'] });
  const camera = useTransform(scrollYProgress, (t) => cameraAt(t, n));
  const [active, setActive] = useState(0);
  useMotionValueEvent(camera, 'change', (c) => setActive(Math.min(Math.max(Math.round(c), 0), n - 1)));

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const measure = () => width.set(stage.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [width]);

  // Keyboard focus on a frame walks the camera to it.
  const focusFrame = (index) => {
    const pin = pinRef.current;
    const top = pin.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + focusProgress(index, n) * (pin.offsetHeight - window.innerHeight));
  };

  const work = works[active];
  const author = site.team.find(({ slug }) => slug === work.barber);

  return (
    <div ref={pinRef} style={{ height: `${(1 + screens) * 100}svh` }} className="relative">
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
        <div className="relative z-20 mx-auto max-w-6xl pl-5 pr-[var(--gutter)] pt-[calc(theme(spacing.header)+2rem)]">{title}</div>
        <div className="absolute inset-0" style={{ perspective: `${look.perspective}px`, perspectiveOrigin: `50% ${VANISH_Y}` }}>
          {works.map((item, index) => (
            <Frame key={item.src} work={item} index={index} count={n} camera={camera} width={width} look={look} onOpen={onOpen} onFocusFrame={focusFrame} />
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-20 lg:bottom-10">
          <div className="mx-auto flex max-w-6xl items-end gap-4 pl-5 pr-[var(--gutter)]">
            <span className="text-5xl font-extrabold leading-none tabular-nums lg:text-7xl">{pad(active + 1)}</span>
            <span className="pb-1 text-xs font-medium uppercase tracking-heading text-concrete">
              / {pad(n)}
              {author && ` · ${site.ui.works.author} ${author.name}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
