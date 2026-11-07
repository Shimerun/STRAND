import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  ACESFilmicToneMapping,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import Shears, { CONFIG } from './Shears.jsx';
import { useScissorsRig } from './useScissorsRig.js';

// Dev-only helper: the dynamic import is dead code in production builds.
const ScissorsDebug = import.meta.env.DEV ? lazy(() => import('./ScissorsDebug.jsx')) : null;
const isDebug = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

const CAMERA = { fov: 35, position: [0, 0, 10], near: 0.1, far: 50 };
const DPR = [1, 1.75];
const EXPOSURE = 1.05;
const STRIP = { width: 0.6, height: 12, boost: 30, x: 9, y: 2, z: 4, turn: Math.PI / 2.3 };

// Procedural studio: RoomEnvironment plus two tall strip lights for long soft highlights on the steel.
function Studio() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const geometry = new PlaneGeometry(STRIP.width, STRIP.height);
    const material = new MeshBasicMaterial({ color: new Color(1, 1, 1).multiplyScalar(STRIP.boost), side: DoubleSide });
    [-1, 1].forEach((side) => {
      const strip = new Mesh(geometry, material);
      strip.position.set(side * STRIP.x, STRIP.y, STRIP.z);
      strip.rotation.y = -side * STRIP.turn;
      room.add(strip);
    });
    const envMap = pmrem.fromScene(room, 0.03).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 1;
    room.dispose(); // also disposes the strip geometry and material
    return () => {
      scene.environment = null;
      envMap.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  // Rim light from behind-right.
  return <spotLight position={[6, 4, -6]} angle={0.6} penumbra={1} intensity={150} />;
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

export default function Scissors3D() {
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
          <Studio />
          <Suspense fallback={null}>
            <Rig config={config} hold={hold} layerRef={layerRef} showAxes={debug} onInfo={debug ? setInfo : undefined} />
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
