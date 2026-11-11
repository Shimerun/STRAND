import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FLAT, VIEW_HEIGHT } from './pose.js';
import { createRigMotion, heroPose } from './rigMotion.js';
import Shears2D, { SVG } from './Shears2D.jsx';
import { useScissorsSignals } from './useScissorsSignals.js';

const screenOf = (layer) => ({ width: layer.clientWidth, height: layer.clientHeight });

// Moves the SVG with transform only: centre, tilt in the screen plane, yaw / pitch as foreshortening.
function place(svg, pose) {
  const { x, y, z } = pose.rotation;
  const k = pose.length / SVG.length;
  svg.style.transform =
    `translate3d(${pose.x - SVG.cx}px, ${pose.y - SVG.cy}px, 0) rotate(${-z}rad) scale(${k * Math.cos(y)}, ${k * Math.cos(x)})`;
}

function openHalves(halfA, halfB, deg) {
  halfA.setAttribute('transform', `rotate(${-deg} ${SVG.pivot})`);
  halfB.setAttribute('transform', `rotate(${deg} ${SVG.pivot})`);
}

// Same motion as the 3D shears (shared rigMotion), drawn on demand with requestAnimationFrame.
function MovingShears() {
  const layerRef = useRef(null);
  const svgRef = useRef(null);
  const halfARef = useRef(null);
  const halfBRef = useRef(null);
  const loop = useRef({ raf: 0, last: 0, tick: null });
  const requestFrame = useCallback(() => {
    const current = loop.current;
    if (current.raf || !current.tick) return;
    current.raf = requestAnimationFrame((now) => {
      current.raf = 0;
      current.tick?.(now);
    });
  }, []);
  const { signals, scrollY, dock } = useScissorsSignals(requestFrame);
  const [step] = useState(() => createRigMotion());

  useEffect(() => {
    const current = loop.current;
    const start = performance.now();
    let opacity = -1;
    // The layer's size is read when it changes, never in the frame loop (that forced a layout every frame).
    let screen = screenOf(layerRef.current);
    const resized = new ResizeObserver(() => {
      screen = screenOf(layerRef.current);
      requestFrame();
    });
    resized.observe(layerRef.current);
    current.tick = (now) => {
      const layer = layerRef.current;
      const frame = step({
        time: (now - start) / 1000,
        dt: current.last ? (now - current.last) / 1000 : 0,
        scrollY: scrollY.get(),
        dock: dock.get(),
        signals: signals.current,
        screen,
        unit: screen.height / VIEW_HEIGHT,
        length: FLAT.length,
        maxOpen: FLAT.maxOpen,
      });
      current.last = now;
      place(svgRef.current, frame);
      openHalves(halfARef.current, halfBRef.current, frame.open);
      if (frame.opacity !== opacity) layer.style.opacity = String(frame.opacity);
      opacity = frame.opacity;
      if (frame.active) requestFrame();
    };
    requestFrame();
    return () => {
      resized.disconnect();
      cancelAnimationFrame(current.raf);
      current.raf = 0;
      current.tick = null;
    };
  }, [dock, requestFrame, scrollY, signals, step]);

  return (
    <div ref={layerRef} className="scissors-layer" style={{ opacity: 0 }} aria-hidden="true">
      <Shears2D svgRef={svgRef} halfARef={halfARef} halfBRef={halfBRef} />
    </div>
  );
}

// Reduced motion: a closed pair in the hero pose that scrolls away with the hero; no travel, no motion.
function StillShears() {
  const layerRef = useRef(null);
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    const placeStill = () => {
      const screen = screenOf(layerRef.current);
      place(svgRef.current, heroPose(screen, screen.height / VIEW_HEIGHT, FLAT.length));
    };
    placeStill();
    window.addEventListener('resize', placeStill);
    return () => window.removeEventListener('resize', placeStill);
  }, []);

  return (
    <div ref={layerRef} className="scissors-layer" style={{ position: 'absolute' }} aria-hidden="true">
      <Shears2D svgRef={svgRef} />
    </div>
  );
}

/** 2D SVG shears for devices without (fast) WebGL; still: the reduced-motion variant. */
export default function ScissorsFallback({ still = false }) {
  return still ? <StillShears /> : <MovingShears />;
}
