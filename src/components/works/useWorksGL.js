import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/scroll.js';
import { hasWebGL, isWebGLOff } from '../../lib/webgl.js';

const NEAR_MARGIN = '100% 0px'; // the grid counts as near from one screen away
const REST_MS = 200; // no scroll events for this long: the page is at rest

const canRun = () => !prefersReducedMotion() && !navigator.connection?.saveData && !isWebGLOff() && hasWebGL();

/**
 * Whether the works grid is drawn in WebGL (gl/WorksGL.jsx). `active`: the device can, and the page has come
 * to rest near the grid at least once. Starting the canvas (a WebGL context, shaders, textures) takes a long
 * frame, so it never starts mid-scroll: until then, and on a pass without a stop, the DOM photos are shown,
 * and at rest the two look the same. `near`: the grid is near the screen right now.
 * `frames` maps each photo's index to its frame element (ref it with `register(index)`); `disable` falls back
 * to the DOM photos for good. enabled: false keeps everything off (no photos yet).
 */
export function useWorksGL(listRef, enabled) {
  const [able, setAble] = useState(() => enabled && canRun());
  const [near, setNear] = useState(false);
  const [started, setStarted] = useState(false);
  const frames = useRef(new Map());

  useEffect(() => {
    if (!able) return undefined;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: NEAR_MARGIN });
    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [able, listRef]);

  useEffect(() => {
    if (!able || !near || started) return undefined;
    const start = () => setStarted(true);
    let timer = window.setTimeout(start, REST_MS);
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(start, REST_MS);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [able, near, started]);

  const register = (index) => (element) => {
    if (element) frames.current.set(index, element);
    else frames.current.delete(index);
  };
  const disable = useCallback(() => setAble(false), []);

  return { active: able && started, near, frames, register, disable };
}
