import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/scroll.js';
import './cursor.css';

// Speed: share of the remaining distance the ring covers per frame (0.15–0.2 = soft lag, 1 = no lag).
const RING_LERP = 0.18;
const SETTLE_PX = 0.1; // the loop stops once the ring is this close to the dot
const ROOT_CLASS = 'has-custom-cursor';
// The ring grows over these.
const CLICKABLE = 'a, button, [role="button"], [role="option"], .btn, label, select, summary';
// The system cursor takes over here; iframes (the map) draw their own.
const NATIVE = 'input:not([type="radio"], [type="checkbox"]), textarea, [contenteditable="true"], iframe';

/** Dot that follows the mouse exactly and a ring that trails it. Mounted only on mouse devices. */
export default function Cursor() {
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const lerp = prefersReducedMotion() ? 1 : RING_LERP;
    const mouse = { x: 0, y: 0 };
    const ring = { x: 0, y: 0 };
    let started = false;
    let frame = 0;

    const place = (element, { x, y }) => {
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const tick = () => {
      ring.x += (mouse.x - ring.x) * lerp;
      ring.y += (mouse.y - ring.y) * lerp;
      const settled = Math.abs(mouse.x - ring.x) < SETTLE_PX && Math.abs(mouse.y - ring.y) < SETTLE_PX;
      if (settled) Object.assign(ring, mouse);
      place(ringRef.current, ring);
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      if (event.pointerType !== 'mouse') return; // touch / pen on hybrid laptops keep their own feedback
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (!started) {
        Object.assign(ring, mouse);
        started = true;
      }
      place(dotRef.current, mouse);
      const target = event.target instanceof Element ? event.target : null;
      root.classList.toggle('is-hidden', Boolean(target?.closest(NATIVE)));
      root.classList.toggle('is-hover', Boolean(target?.closest(CLICKABLE)));
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onDown = (event) => event.button === 0 && root.classList.add('is-pressed');
    const onUp = () => root.classList.remove('is-pressed');
    // relatedTarget is null when the pointer leaves the window; the next move shows the cursor again.
    const onOut = (event) => {
      if (!event.relatedTarget) root.classList.add('is-hidden');
    };

    document.documentElement.classList.add(ROOT_CLASS);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('blur', onUp);
    document.addEventListener('mouseout', onOut);

    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove(ROOT_CLASS);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onUp);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <div ref={rootRef} className="cursor is-hidden" aria-hidden="true">
      <div ref={ringRef} className="cursor-ring">
        <span className="cursor-ring-shape" />
      </div>
      <div ref={dotRef} className="cursor-dot">
        <span className="cursor-dot-shape" />
      </div>
    </div>
  );
}
