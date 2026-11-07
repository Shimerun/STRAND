import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Box3, LoopOnce, MathUtils, Matrix4, Quaternion, Vector3 } from 'three';

export const CONFIG = {
  ORIENTATION: [0, 0, Math.PI / 2], // Euler radians: blades point +Y, rings -Y, shears flat in the XY plane
  SCALE: 4,               // long axis in world units
  PIVOT: null,            // [x,y,z] in model space (screw / point between the halves); null = bounding-box centre
  MAX_OPEN: 30,           // max degrees PER HALF; I tune this by eye so the blades never cross
  SIGN_A: 1, SIGN_B: -1,  // flip a sign if a half opens the wrong way (unused while the built-in Snip clip drives the halves)
};

const MODEL_URL = '/models/scissors.glb';
const USE_DRACO = false; // model is meshopt-compressed; never fetch a Draco decoder from a CDN
const SAMPLES = 120;

// Bounding box in the model's own space, independent of where the scene is mounted.
function modelBox(root) {
  root.updateWorldMatrix(true, true);
  const toRoot = new Matrix4().copy(root.matrixWorld).invert();
  const relative = new Matrix4();
  const box = new Box3();
  const part = new Box3();
  root.traverse((object) => {
    if (!object.isMesh) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    part.copy(object.geometry.boundingBox).applyMatrix4(relative.multiplyMatrices(toRoot, object.matrixWorld));
    box.union(part);
  });
  const size = box.getSize(new Vector3());
  return { center: box.getCenter(new Vector3()).toArray(), maxSize: Math.max(size.x, size.y, size.z) };
}

// Maps "degrees open per half" to a time on the clip: samples each half's rotation away from
// its pose at t = 0 (closed) up to the most open moment, then inverts that curve.
function buildSnipTimeline(clip) {
  const interpolants = clip.tracks.filter((track) => track.name.endsWith('.quaternion')).map((track) => track.createInterpolant());
  if (!interpolants.length) return null;
  const start = interpolants.map((interpolant) => new Quaternion().fromArray(interpolant.evaluate(0)));
  const current = new Quaternion();
  const times = [];
  const angles = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const time = (clip.duration * i) / SAMPLES;
    let angle = 0;
    interpolants.forEach((interpolant, j) => {
      angle = Math.max(angle, start[j].angleTo(current.fromArray(interpolant.evaluate(time))));
    });
    times.push(time);
    angles.push(MathUtils.radToDeg(angle));
  }
  const openIndex = angles.indexOf(Math.max(...angles));

  return {
    maxDeg: angles[openIndex],
    timeFor(deg) {
      if (deg <= 0) return 0;
      for (let i = 1; i <= openIndex; i += 1) {
        if (angles[i] >= deg) {
          const span = angles[i] - angles[i - 1] || 1;
          return times[i - 1] + ((deg - angles[i - 1]) / span) * (times[i] - times[i - 1]);
        }
      }
      return times[openIndex];
    },
  };
}

export default function Shears({ config = CONFIG, openRef, onInfo }) {
  const { scene, animations } = useGLTF(MODEL_URL, USE_DRACO);
  const { actions, mixer } = useAnimations(animations, scene);
  const clip = animations[0];
  const timeline = useMemo(() => (clip ? buildSnipTimeline(clip) : null), [clip]);
  const box = useMemo(() => modelBox(scene), [scene]);
  const pivot = config.PIVOT ?? box.center;

  useEffect(() => {
    const action = clip && actions[clip.name];
    if (!action) return undefined;
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    action.paused = true; // the rig scrubs action.time, the clip never plays by itself
    return () => action.stop();
  }, [actions, clip]);

  useEffect(() => {
    onInfo?.({ clipMaxDeg: timeline?.maxDeg ?? null });
  }, [onInfo, timeline]);

  useFrame(() => {
    const action = clip && actions[clip.name];
    if (!action || !timeline) return;
    action.time = timeline.timeFor(MathUtils.clamp(openRef.current, 0, config.MAX_OPEN));
    mixer.update(0);
  });

  return (
    <group rotation={config.ORIENTATION} scale={config.SCALE / box.maxSize}>
      <primitive object={scene} position={[-pivot[0], -pivot[1], -pivot[2]]} />
    </group>
  );
}

useGLTF.preload(MODEL_URL, USE_DRACO);
