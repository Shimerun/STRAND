import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import ContextWatch from '../WebGLContextWatch.jsx';
import { Compile, FrameProbe, FrameWatch, Ready } from './frameBudget.jsx';
import { CAMERA, DESKTOP_MIN_PX } from './pose.js';
import Shears, { CONFIG } from './Shears.jsx';
import { SHEET_Z } from './sheet.js';
import Studio from './Studio.jsx';
import { useScissorsRig } from './useScissorsRig.js';

// Dev-only helper: the dynamic import is dead code in production builds.
const ScissorsDebug = import.meta.env.DEV ? lazy(() => import('./ScissorsDebug.jsx')) : null;
const isDebug = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

const SHADOW_PLANE = [40, 40]; // world units, wider than any viewport
// Pixel density of the full-screen canvas, which redraws on every scroll frame while the shears move. Below
// desktop the shears are at most ~240px long, so 1.25 looks the same as 1.75 and halves the pixels per frame.
const DPR = window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`).matches ? [1, 1.75] : [1, 1.25];
const EXPOSURE = 1.05;
function Rig({ config, hold, layerRef, showAxes, onInfo }) {
  const { groupRef, rollRef, shadowRef, openRef } = useScissorsRig({ maxOpen: config.MAX_OPEN, length: config.SCALE, layerRef, hold });

  return (
    <>
      <group ref={groupRef}>
        <group ref={rollRef}>
          <Shears config={config} openRef={openRef} onInfo={onInfo} />
        </group>
        {showAxes && <axesHelper args={[2.5]} />}
      </group>
      {/* Shadow catcher on the hero photo while it is cut; transparent everywhere else. */}
      <mesh ref={shadowRef} position={[0, 0, SHEET_Z]} receiveShadow visible={false}>
        <planeGeometry args={SHADOW_PLANE} />
        <shadowMaterial transparent depthWrite={false} opacity={0} />
      </mesh>
    </>
  );
}

/** WebGL shears. onLost: the context was lost; onSlow: the frame-time probe failed. Both must be stable. */
export default function Scissors3D({ onLost, onSlow }) {
  const [debug] = useState(isDebug);
  const [config, setConfig] = useState(CONFIG);
  const [hold, setHold] = useState(debug ? 'open' : null);
  const [info, setInfo] = useState(null);
  // Nothing is drawn until every shader is linked (Compile); the rig then fades the shears in where they are.
  const [compiled, setCompiled] = useState(false);
  const onCompiled = useCallback(() => setCompiled(true), []);
  const layerRef = useRef(null);

  return (
    <>
      <div ref={layerRef} className="scissors-layer" style={{ opacity: 0 }} aria-hidden="true">
        <Canvas
          frameloop={compiled ? 'demand' : 'never'}
          shadows
          dpr={DPR}
          camera={CAMERA}
          gl={{ antialias: true, alpha: true }}
          resize={{ scroll: false }}
          style={{ pointerEvents: 'none' }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = EXPOSURE;
            gl.localClippingEnabled = true; // sheet.js: the blade under the hero photo
          }}
        >
          <ContextWatch onLost={onLost} />
          <Studio />
          <Suspense fallback={null}>
            <Rig config={config} hold={hold} layerRef={layerRef} showAxes={debug} onInfo={debug ? setInfo : undefined} />
            {compiled ? <Ready /> : <Compile onReady={onCompiled} />}
            {compiled && !debug && <FrameProbe onSlow={onSlow} />}
            {compiled && !debug && <FrameWatch onSlow={onSlow} />}
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
