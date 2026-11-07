import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import { CAMERA } from './pose.js';
import Shears, { CONFIG } from './Shears.jsx';
import Studio from './Studio.jsx';
import { useScissorsRig } from './useScissorsRig.js';

// Dev-only helper: the dynamic import is dead code in production builds.
const ScissorsDebug = import.meta.env.DEV ? lazy(() => import('./ScissorsDebug.jsx')) : null;
const isDebug = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

const DPR = [1, 1.75];
const EXPOSURE = 1.05;
const PROBE = { frames: 30, skip: 5, slowMs: 30 };

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// A lost WebGL context hands over to the 2D fallback.
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

// Mounts once the model has loaded: forces PROBE.frames renders and calls onSlow when the median
// requestAnimationFrame delta, ignoring the first PROBE.skip, is above PROBE.slowMs.
function FrameProbe({ onSlow }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const deltas = [];
    let frame = 0;
    let count = 0;
    let last = 0;
    // A hidden tab stalls requestAnimationFrame, which would read as a slow device: start over.
    const restart = () => {
      deltas.length = 0;
      count = 0;
      last = 0;
    };
    const sample = (now) => {
      if (last) {
        count += 1;
        if (count > PROBE.skip) deltas.push(now - last);
      }
      last = now;
      if (count >= PROBE.frames) {
        if (median(deltas) > PROBE.slowMs) onSlow();
        return;
      }
      invalidate();
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    document.addEventListener('visibilitychange', restart);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', restart);
    };
  }, [invalidate, onSlow]);

  return null;
}

function Rig({ config, hold, layerRef, showAxes, onInfo }) {
  const { groupRef, openRef } = useScissorsRig({ maxOpen: config.MAX_OPEN, length: config.SCALE, layerRef, hold });

  return (
    <group ref={groupRef}>
      <Shears config={config} openRef={openRef} onInfo={onInfo} />
      {showAxes && <axesHelper args={[2.5]} />}
    </group>
  );
}

/** WebGL shears. onLost: the context was lost; onSlow: the frame-time probe failed. Both must be stable. */
export default function Scissors3D({ onLost, onSlow }) {
  const [debug] = useState(isDebug);
  const [config, setConfig] = useState(CONFIG);
  const [hold, setHold] = useState(debug ? 'open' : null);
  const [info, setInfo] = useState(null);
  const layerRef = useRef(null);

  return (
    <>
      <div ref={layerRef} className="scissors-layer" aria-hidden="true">
        <Canvas
          frameloop="demand"
          dpr={DPR}
          camera={CAMERA}
          gl={{ antialias: true, alpha: true }}
          resize={{ scroll: false }}
          style={{ pointerEvents: 'none' }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = EXPOSURE;
          }}
        >
          <ContextWatch onLost={onLost} />
          <Studio />
          <Suspense fallback={null}>
            <Rig config={config} hold={hold} layerRef={layerRef} showAxes={debug} onInfo={debug ? setInfo : undefined} />
            {!debug && <FrameProbe onSlow={onSlow} />}
          </Suspense>
        </Canvas>
      </div>
      {debug && ScissorsDebug && (
        <Suspense fallback={null}>
          <ScissorsDebug config={config} onChange={setConfig} hold={hold} onHold={setHold} info={info} />
        </Suspense>
      )}
    </>
  );
}
