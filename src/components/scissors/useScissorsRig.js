import { useLayoutEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Quaternion, Vector3 } from 'three';
import { rig } from './rig.js';
import { createRigMotion } from './rigMotion.js';
import { createSheet } from './sheet.js';
import { useScissorsSignals } from './useScissorsSignals.js';

const RIG_PRIORITY = -1; // runs before Shears reads openRef; negative keeps auto-rendering on
// s: the shears fade in where the scroll has them when they are first drawn, rather than popping in mid-cut.
const REVEAL_S = 0.45;
const MAX_REVEAL_STEP = 1 / 30; // s: the first frame's delta spans the whole load

/**
 * Drives the 3D shears from the shared motion (rigMotion.js): writes the transform into groupRef, the roll
 * about the long axis into rollRef (a group inside it), the opening (degrees per half) into openRef, the fade
 * into layerRef and the projected tip into `rig`; while the hero is cut, the photo acts as a sheet (sheet.js)
 * with its shadow catcher in shadowRef. hold: null | 'open' | 'closed' — the debug helper pins the opening.
 */
export function useScissorsRig({ maxOpen, length, layerRef, hold = null }) {
  const groupRef = useRef(null);
  const rollRef = useRef(null);
  const shadowRef = useRef(null);
  const openRef = useRef(0);
  const opacityRef = useRef(-1);
  const revealRef = useRef(0);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  const { signals, scrollY, dock } = useScissorsSignals(invalidate);
  const [step] = useState(() => createRigMotion());
  const [sheet] = useState(() => createSheet());
  const [tmp] = useState(() => ({ tip: new Vector3(), euler: new Euler(), qHero: new Quaternion(), qTrack: new Quaternion() }));

  // The rig mounts with the loaded model (both wait on one Suspense): the materials take their clipping planes now,
  // so the shaders compiled before the first frame are the ones it uses.
  useLayoutEffect(() => {
    if (groupRef.current) sheet.attach(groupRef.current);
  }, [sheet]);

  useFrame(({ viewport, size, camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const unit = viewport.factor; // CSS px per world unit at z = 0
    const frame = step({
      dt: delta,
      scrollY: scrollY.get(),
      dock: dock.get(),
      signals: signals.current,
      screen: size,
      unit,
      length,
      maxOpen,
    });

    group.position.set((frame.x - size.width / 2) / unit, (size.height / 2 - frame.y) / unit, 0);
    group.scale.setScalar(frame.length / unit / length);
    const { tip, euler, qHero, qTrack } = tmp;
    const { heroRotation: h, trackRotation: t } = frame;
    qHero.setFromEuler(euler.set(h.x, h.y, h.z));
    qTrack.setFromEuler(euler.set(t.x, t.y, t.z));
    group.quaternion.slerpQuaternions(qHero, qTrack, frame.dock);
    if (rollRef.current) rollRef.current.rotation.y = frame.roll;
    group.updateMatrixWorld();
    sheet({ group, paper: frame.paper, reach: frame.reach / unit, gl, shadow: shadowRef.current });

    if (hold === 'open') openRef.current = maxOpen;
    else if (hold === 'closed') openRef.current = 0;
    else openRef.current = frame.open;

    revealRef.current = Math.min(revealRef.current + Math.min(delta, MAX_REVEAL_STEP) / REVEAL_S, 1);
    const opacity = Math.round(frame.opacity * revealRef.current * 1000) / 1000;
    if (opacity !== opacityRef.current && layerRef.current) layerRef.current.style.opacity = String(opacity);
    opacityRef.current = opacity;

    tip.set(0, length / 2, 0).applyMatrix4(group.matrixWorld).project(camera);
    rig.tipX = ((tip.x + 1) / 2) * size.width;
    rig.tipY = ((1 - tip.y) / 2) * size.height;

    if (frame.active || revealRef.current < 1) invalidate();
  }, RIG_PRIORITY);

  return { groupRef, rollRef, shadowRef, openRef };
}
