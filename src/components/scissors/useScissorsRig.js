import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import { prefersReducedMotion } from '../../lib/scroll.js';
import {
  BURST_DURATION, DESKTOP_MIN_PX, HERO, HERO_EULER, SPIN, TRACK,
  idleSnip, scrollSnip, trackFade, trackPoint, trackTurn, withBurst,
} from './pose.js';
import { burstElapsed, rig } from './rig.js';
import { readTrack, useScissorsSignals } from './useScissorsSignals.js';

const RIG_PRIORITY = -1; // runs before Shears reads openRef; negative keeps auto-rendering on
const POINTER = { max: 8 * (Math.PI / 180), lerp: 0.08, settle: 1e-4 };
const LAG = 8; // 1/s: the shears trail the scroll, as in the demo
const LAG_SETTLE = 0.5; // px
const MAX_DT = 0.05;
const UP = new Vector3(0, 1, 0);

const { clamp, lerp } = MathUtils;

/**
 * Owns the shears' motion: the hero's spinning 3/4 view with an idle snip, docking onto the gutter
 * track, turning over and snipping with the (slightly trailing) scroll, bursts and pointer lean.
 * Writes the transform into groupRef, the opening (degrees per half) into openRef, the fade into
 * layerRef, and the tip position into `rig`.
 * hold: null | 'open' | 'closed' — the debug helper pins the opening.
 */
export function useScissorsRig({ maxOpen, length, layerRef, hold = null }) {
  const groupRef = useRef(null);
  const openRef = useRef(0);
  const [reduce] = useState(prefersReducedMotion);
  const { signals, scrollY, dock, dockTarget } = useScissorsSignals(reduce);
  const state = useRef({ lean: { x: 0, y: 0 }, smoothY: null, opacity: -1 });
  const [tmp] = useState(() => ({
    tip: new Vector3(), euler: new Euler(), qHero: new Quaternion(), qTrack: new Quaternion(), qSpin: new Quaternion(),
  }));

  useFrame(({ viewport, size, clock, camera, invalidate }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const s = signals.current;
    const m = state.current;
    const desktop = size.width >= DESKTOP_MIN_PX;
    const hero = desktop ? HERO.desktop : HERO.mobile;
    const track = desktop ? TRACK.desktop : TRACK.mobile;
    const time = reduce ? 0 : clock.elapsedTime;
    const dt = Math.min(delta, MAX_DT);
    const d = reduce ? dockTarget.get() : dock.get();

    const y = scrollY.get();
    if (m.smoothY === null || reduce || Math.abs(y - m.smoothY) <= LAG_SETTLE) m.smoothY = y;
    else m.smoothY += (y - m.smoothY) * (1 - Math.exp(-LAG * dt));
    const range = readTrack(s.heroHeight);
    const p = clamp((m.smoothY - range.start) / range.span, 0, 1);

    // Track position in CSS px, converted to world units at z = 0.
    const px = 1 / viewport.factor;
    const point = trackPoint(p, { width: document.documentElement.clientWidth, height: size.height }, s.gutter, track);
    const heroScale = Math.min(hero.scale, (hero.fit * viewport.width) / length);
    group.position.set(
      lerp(hero.x * viewport.width, (point.x - size.width / 2) * px, d),
      lerp(hero.y * viewport.height, (size.height / 2 - point.y) * px, d),
      0,
    );
    group.scale.setScalar(lerp(heroScale, (track.length * px) / length, d));

    const k = 1 - (1 - POINTER.lerp) ** (dt * 60); // frame-rate independent lerp
    const lean = m.lean;
    lean.x += (s.pointer.y * POINTER.max - lean.x) * k;
    lean.y += (s.pointer.x * POINTER.max - lean.y) * k;

    const { tip, euler, qHero, qTrack, qSpin } = tmp;
    qHero.setFromEuler(euler.set(HERO_EULER[0] + lean.x, HERO_EULER[1] + lean.y, HERO_EULER[2]));
    qHero.premultiply(qSpin.setFromAxisAngle(UP, SPIN * time));
    const turn = trackTurn(reduce ? 0 : p);
    qTrack.setFromEuler(euler.set(turn.x + lean.x, turn.y + lean.y, point.tilt));
    group.quaternion.slerpQuaternions(qHero, qTrack, d);

    const burst = burstElapsed();
    if (hold === 'open') openRef.current = maxOpen;
    else if (hold === 'closed' || reduce) openRef.current = 0;
    else openRef.current = withBurst(lerp(idleSnip(time), scrollSnip(m.smoothY, size.height), d), burst);

    // Fade over the end of the track; hidden while the end element is on screen or above it.
    const opacity = range.endTop < window.innerHeight ? 0 : Math.round(trackFade(p) * 1000) / 1000;
    if (opacity !== m.opacity && layerRef.current) layerRef.current.style.opacity = String(opacity);
    m.opacity = opacity;
    rig.visible = opacity > 0;

    group.updateMatrixWorld();
    tip.set(0, length / 2, 0).applyMatrix4(group.matrixWorld).project(camera);
    rig.tipX = ((tip.x + 1) / 2) * size.width;
    rig.tipY = ((1 - tip.y) / 2) * size.height;

    if (s.pageHidden) return;
    const idle = !reduce && s.heroVisible;
    const leaning = Math.abs(s.pointer.y * POINTER.max - lean.x) + Math.abs(s.pointer.x * POINTER.max - lean.y) > POINTER.settle;
    const trailing = m.smoothY !== y;
    const bursting = !reduce && burst < BURST_DURATION;
    if (idle || leaning || trailing || bursting) invalidate();
  }, RIG_PRIORITY);

  return { groupRef, openRef };
}
