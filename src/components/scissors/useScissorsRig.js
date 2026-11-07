import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Quaternion, Vector3 } from 'three';
import { rig } from './rig.js';
import { createRigMotion } from './rigMotion.js';
import { useScissorsSignals } from './useScissorsSignals.js';

const RIG_PRIORITY = -1; // runs before Shears reads openRef; negative keeps auto-rendering on

/**
 * Drives the 3D shears from the shared motion (rigMotion.js): writes the transform into groupRef,
 * the opening (degrees per half) into openRef, the fade into layerRef and the projected tip into `rig`.
 * hold: null | 'open' | 'closed' — the debug helper pins the opening.
 */
export function useScissorsRig({ maxOpen, length, layerRef, hold = null }) {
  const groupRef = useRef(null);
  const openRef = useRef(0);
  const opacityRef = useRef(-1);
  const invalidate = useThree((state) => state.invalidate);
  const { signals, scrollY, dock } = useScissorsSignals(invalidate);
  const [step] = useState(() => createRigMotion());
  const [tmp] = useState(() => ({ tip: new Vector3(), euler: new Euler(), qHero: new Quaternion(), qTrack: new Quaternion() }));

  useFrame(({ viewport, size, clock, camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const unit = viewport.factor; // CSS px per world unit at z = 0
    const frame = step({
      time: clock.elapsedTime,
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

    if (hold === 'open') openRef.current = maxOpen;
    else if (hold === 'closed') openRef.current = 0;
    else openRef.current = frame.open;

    if (frame.opacity !== opacityRef.current && layerRef.current) layerRef.current.style.opacity = String(frame.opacity);
    opacityRef.current = frame.opacity;

    group.updateMatrixWorld();
    tip.set(0, length / 2, 0).applyMatrix4(group.matrixWorld).project(camera);
    rig.tipX = ((tip.x + 1) / 2) * size.width;
    rig.tipY = ((1 - tip.y) / 2) * size.height;

    if (frame.active) invalidate();
  }, RIG_PRIORITY);

  return { groupRef, openRef };
}
