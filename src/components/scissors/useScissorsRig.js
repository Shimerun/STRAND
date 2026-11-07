import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import { prefersReducedMotion } from '../../lib/scroll.js';
import {
  BURST_DURATION, DESKTOP_MIN_PX, FLOAT, HERO, REST_DEG, SWAY, TRACK,
  easeInOut, idleSnip, scrollSnip, trackFade, trackPoint, withBurst,
} from './pose.js';
import { burstElapsed, rig } from './rig.js';
import { readTrack, useScissorsSignals } from './useScissorsSignals.js';

const TAU = Math.PI * 2;
const RIG_PRIORITY = -1; // runs before Shears reads openRef; negative keeps auto-rendering on
const POINTER = { max: 8 * (Math.PI / 180), lerp: 0.08, settle: 1e-4 };
const SNIP_IN = 0.12; // s to blend from rest into the scroll snip
const SNIP_OUT = 0.4; // s to ease back to rest once scrolling stops
const SCROLL_GRACE = 0.1; // s without a scroll change before scrolling counts as stopped
const MAX_DT = 0.05;

const { lerp } = MathUtils;

/**
 * Owns the shears' motion: hero pose with idle float / sway / snip, docking onto the gutter track,
 * scroll-driven snipping, bursts and pointer lean. Writes the transform into groupRef, the opening
 * (degrees per half) into openRef, the fade into layerRef, and the tip position into `rig`.
 * hold: null | 'open' | 'closed' — the debug helper pins the opening.
 */
export function useScissorsRig({ maxOpen, length, layerRef, hold = null }) {
  const groupRef = useRef(null);
  const openRef = useRef(0);
  const [reduce] = useState(prefersReducedMotion);
  const { signals, scrollY, dock, dockTarget } = useScissorsSignals(reduce);
  const state = useRef({ lean: { x: 0, y: 0 }, blend: 0, lastY: null, movedAt: -Infinity, opacity: -1 });
  const [tip] = useState(() => new Vector3());

  useFrame(({ viewport, size, clock, camera, invalidate }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const s = signals.current;
    const m = state.current;
    const desktop = size.width >= DESKTOP_MIN_PX;
    const hero = desktop ? HERO.desktop : HERO.mobile;
    const track = desktop ? TRACK.desktop : TRACK.mobile;
    const now = clock.elapsedTime;
    const time = reduce ? 0 : now;
    const dt = Math.min(delta, MAX_DT);
    const y = scrollY.get();
    const d = reduce ? dockTarget.get() : dock.get();

    // Track position in CSS px, converted to world units at z = 0.
    const range = readTrack(s.heroHeight);
    const p = MathUtils.clamp((y - range.start) / range.span, 0, 1);
    const screen = { width: document.documentElement.clientWidth, height: size.height };
    const point = trackPoint(p, screen, s.gutter, track);
    const px = 1 / viewport.factor;
    const trackScale = (track.length * px) / length;

    const k = 1 - (1 - POINTER.lerp) ** (dt * 60); // frame-rate independent lerp
    const lean = m.lean;
    lean.x += (s.pointer.y * POINTER.max - lean.x) * k;
    lean.y += (s.pointer.x * POINTER.max - lean.y) * k;

    const still = 1 - d;
    group.position.set(
      lerp(hero.x * viewport.width, (point.x - size.width / 2) * px, d),
      lerp(hero.y * viewport.height, (size.height / 2 - point.y) * px, d) + still * FLOAT.amp * Math.sin(TAU * FLOAT.hz * time),
      0,
    );
    group.scale.setScalar(lerp(hero.scale, trackScale, d));
    group.rotation.set(
      lean.x,
      hero.yaw + still * SWAY.amp * Math.sin(TAU * SWAY.hz * time) + lean.y,
      lerp(hero.tilt, point.tilt, d),
    );

    // Opening: idle snip in the hero, scroll-driven on the way down, easing to rest when scrolling stops.
    if (m.lastY !== null && y !== m.lastY) m.movedAt = now;
    m.lastY = y;
    const scrolling = now - m.movedAt < SCROLL_GRACE;
    m.blend = MathUtils.clamp(m.blend + (scrolling ? dt / SNIP_IN : -dt / SNIP_OUT), 0, 1);
    const rest = lerp(idleSnip(time, maxOpen), REST_DEG, d);
    const burst = burstElapsed();
    if (hold === 'open') openRef.current = maxOpen;
    else if (hold === 'closed' || reduce) openRef.current = 0;
    else openRef.current = withBurst(lerp(rest, scrollSnip(y, maxOpen), easeInOut(m.blend)), burst, maxOpen);

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
    const snipping = !reduce && (m.blend > 0 || burst < BURST_DURATION);
    if (idle || leaning || snipping) invalidate();
  }, RIG_PRIORITY);

  return { groupRef, openRef };
}
