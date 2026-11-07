import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  ACESFilmicToneMapping,
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
} from 'three';
import Shears, { CONFIG } from './Shears.jsx';
import { useScissorsRig } from './useScissorsRig.js';

// Dev-only helper: the dynamic import is dead code in production builds.
const ScissorsDebug = import.meta.env.DEV ? lazy(() => import('./ScissorsDebug.jsx')) : null;
const isDebug = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

const CAMERA = { fov: 30, position: [0, 0, 10], near: 0.1, far: 50 };
const DPR = [1, 1.75];
const EXPOSURE = 1.05;

// Studio from the reference viewer: a dark room lit by soft boxes, for crisp chrome reflections.
const ROOM = { size: 10, wall: 4.9, color: 0x232428, floor: 0x0c0c0d, blur: 0.035 };
// Ceiling strips facing down with dark gaps between them: [depth, z, intensity].
const CEILING = [[3.2, 3.2, 2.0], [2.0, 0.3, 0.9], [2.8, -3.0, 1.5]];
const CEILING_WIDTH = 9.6;
// Soft boxes facing the model: [width, height, x, y, z, intensity, color].
const SOFTBOXES = [
  [9.0, 2.2, 0, 2.75, 4.9, 2.0], // front, upper
  [9.0, 2.0, 0, 0.35, 4.9, 0.55], // dim zone behind the viewer: face-on steel reads grey, not white
  [9.0, 0.8, 0, -1.65, 4.9, 1.2], // low front strip
  [0.9, 7, -4.85, 0.4, 1.4, 2.8], // left strip
  [0.9, 7, 4.85, 0.4, 0.2, 2.0, 0xffefdc], // right strip, warm
  [5.0, 3.0, 0.8, 1.0, -4.9, 1.5], // back panel
];
const KEY_LIGHT = { position: [0.3, 0.6, 1], intensity: 0.6 };

const glow = (intensity, color = 0xffffff) =>
  new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide });

function buildStudio() {
  const studio = new Scene();
  studio.add(new Mesh(new BoxGeometry(ROOM.size, ROOM.size, ROOM.size), new MeshBasicMaterial({ color: ROOM.color, side: BackSide })));
  const floor = new Mesh(new PlaneGeometry(ROOM.size, ROOM.size), new MeshBasicMaterial({ color: ROOM.floor }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -ROOM.wall;
  studio.add(floor);
  CEILING.forEach(([depth, z, intensity]) => {
    const strip = new Mesh(new PlaneGeometry(CEILING_WIDTH, depth), glow(intensity));
    strip.rotation.x = Math.PI / 2;
    strip.position.set(0, ROOM.wall, z);
    studio.add(strip);
  });
  SOFTBOXES.forEach(([width, height, x, y, z, intensity, color]) => {
    const box = new Mesh(new PlaneGeometry(width, height), glow(intensity, color));
    box.position.set(x, y, z);
    box.lookAt(0, 0, 0);
    studio.add(box);
  });
  return studio;
}

function Studio() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const studio = buildStudio();
    const envMap = pmrem.fromScene(studio, ROOM.blur).texture;
    studio.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      object.material.dispose();
    });
    pmrem.dispose();
    scene.environment = envMap;
    return () => {
      scene.environment = null;
      envMap.dispose();
    };
  }, [gl, scene]);

  return <directionalLight position={KEY_LIGHT.position} intensity={KEY_LIGHT.intensity} />;
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
