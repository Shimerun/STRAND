import { Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useScroll, useVelocity } from 'framer-motion';
import { assetUrl } from '../../../lib/assetUrl.js';
import WorkPlane from './WorkPlane.jsx';

const DPR = [1, 1.5];
// Orthographic at zoom 1: one world unit is one CSS px, the origin is the middle of the screen.
const CAMERA = { position: [0, 0, 10], zoom: 1, near: 0.1, far: 100 };
// px/s of scroll that bends the photos fully; how fast (1/s) the bend follows the speed and lets go of it.
const SPEED = { full: 3200, follow: 12, release: 5 };
const MAX_STEP_S = 0.1; // a long frame (tab switch) never makes the bend jump
const KEEP_MS = 1200;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Scroll speed, smoothed into one -1..1 value shared by all planes.
function Strength({ value }) {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useFrame((_, delta) => {
    const target = clamp(velocity.get() / SPEED.full, -1, 1);
    const rate = Math.abs(target) > Math.abs(value.current) ? SPEED.follow : SPEED.release;
    value.current += (target - value.current) * (1 - Math.exp(-rate * Math.min(delta, MAX_STEP_S)));
  });

  return null;
}

// The canvas renders on demand. While the works are near, this asks for frames from the moment something that
// can move a photo happens (scroll, pointer, resize) until KEEP_MS after the last one: long enough for the
// bend to let go and a hover lift to finish. A page standing still draws nothing.
function Ticker({ running }) {
  const invalidate = useThree((state) => state.invalidate);
  const { scrollY } = useScroll();

  useEffect(() => {
    if (!running) return undefined;
    let frame = 0;
    let until = 0;
    const tick = (now) => {
      invalidate();
      frame = now < until ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      until = performance.now() + KEEP_MS;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    wake();
    const stop = scrollY.on('change', wake);
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('pointerdown', wake, { passive: true });
    // The page growing or shrinking (late content, a resize) moves the photos without any scroll.
    const resized = new ResizeObserver(wake);
    resized.observe(document.body);
    return () => {
      stop();
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      resized.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [running, invalidate, scrollY]);

  return null;
}

// A lost WebGL context hands the photos back to the DOM.
function ContextWatch({ onLost }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event) => {
      event.preventDefault();
      onLost();
    };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [gl, onLost]);

  return null;
}

/**
 * The works photos drawn in WebGL over their DOM frames, so they can bend and split into colour channels with
 * the scroll speed. frames: ref to a Map of index -> frame element; running: false pauses the canvas while the
 * grid is far from the screen; onLost: the context was lost.
 */
export default function WorksGL({ works, frames, running, onLost }) {
  const strength = useRef(0);

  return createPortal(
    <div className="works-layer" aria-hidden="true">
      <Canvas
        orthographic
        frameloop="demand"
        camera={CAMERA}
        dpr={DPR}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        resize={{ scroll: false }}
        style={{ pointerEvents: 'none' }}
      >
        <Ticker running={running} />
        <ContextWatch onLost={onLost} />
        <Strength value={strength} />
        {works.map((work, index) => (
          <Suspense key={work.src} fallback={null}>
            <WorkPlane src={assetUrl(work.src)} height={work.height} index={index} frames={frames} strength={strength} />
          </Suspense>
        ))}
      </Canvas>
    </div>,
    document.body,
  );
}
