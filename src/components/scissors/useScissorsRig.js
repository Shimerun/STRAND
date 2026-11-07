import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { prefersReducedMotion } from '../../lib/scroll.js';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const DESKTOP_MIN_PX = 1024;
const RIG_PRIORITY = -1; // runs before Shears reads openRef; negative keeps auto-rendering on

// Hero pose: x / y as fractions of the viewport (world units at z = 0), scale relative to CONFIG.SCALE.
const POSES = {
  desktop: { x: 0.22, y: 0, scale: 1, tilt: -35 * DEG, yaw: 18 * DEG },
  mobile: { x: 0, y: -0.04, scale: 0.62, tilt: -35 * DEG, yaw: 18 * DEG },
};
const FLOAT = { amp: 0.06, hz: 0.8 };
const SWAY = { amp: 12 * DEG, hz: 0.25 };
const SNIP = { period: 2.8, open: 0.35, close: 0.25 };
const POINTER = { max: 8 * DEG, lerp: 0.08 };

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// Degrees per half for the idle snip at a given time.
function snipAngle(time, maxOpen) {
  const phase = time % SNIP.period;
  if (phase < SNIP.open) return maxOpen * easeInOut(phase / SNIP.open);
  if (phase < SNIP.open + SNIP.close) return maxOpen * (1 - easeInOut((phase - SNIP.open) / SNIP.close));
  return 0;
}

function usePointer(enabled) {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const onMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled]);

  return pointer;
}

/**
 * Owns the shears' motion state: hero pose, idle float / sway / snip, pointer parallax.
 * Writes the transform into groupRef and the opening (degrees per half) into openRef.
 * hold: null (idle snip) | 'open' | 'closed' — the debug helper pins the opening.
 */
export function useScissorsRig({ maxOpen, hold = null }) {
  const groupRef = useRef(null);
  const openRef = useRef(0);
  const lean = useRef({ x: 0, y: 0 });
  const [reduce] = useState(prefersReducedMotion);
  const pointer = usePointer(!reduce);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const { viewport, size, clock } = state;
    const pose = size.width >= DESKTOP_MIN_PX ? POSES.desktop : POSES.mobile;
    const time = reduce ? 0 : clock.elapsedTime;

    const k = 1 - (1 - POINTER.lerp) ** (delta * 60); // frame-rate independent lerp
    lean.current.x += (pointer.current.y * POINTER.max - lean.current.x) * k;
    lean.current.y += (pointer.current.x * POINTER.max - lean.current.y) * k;

    group.position.set(
      pose.x * viewport.width,
      pose.y * viewport.height + FLOAT.amp * Math.sin(TAU * FLOAT.hz * time),
      0,
    );
    group.scale.setScalar(pose.scale);
    group.rotation.set(lean.current.x, pose.yaw + SWAY.amp * Math.sin(TAU * SWAY.hz * time) + lean.current.y, pose.tilt);

    if (hold === 'open') openRef.current = maxOpen;
    else if (hold === 'closed' || reduce) openRef.current = 0;
    else openRef.current = snipAngle(time, maxOpen);

    if (!reduce) state.invalidate(); // frameloop="demand": keep the idle motion running
  }, RIG_PRIORITY);

  return { groupRef, openRef };
}
