import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

// The 3D shears' cost on the main thread and the frame budget: shaders linked before the first frame, the start-up
// probe and the watch that hands over to the 2D shears.

const PROBE = { frames: 30, skip: 5, slowMs: 30 };
// While the shears move: of each `window` frames drawn back to back (a gap over `gapMs` is a pause, not a frame),
// more than `share` over `slowMs` is a missed window; `misses` in a row hand over to the 2D shears.
const WATCH = { window: 90, gapMs: 250, slowMs: 34, share: 0.5, misses: 2 };

// Upper median: the probe always ends with an odd count (frames - skip), where it is the plain median.
const median = (values) => [...values].sort((a, b) => a - b)[values.length >> 1];

// Links every shader before the first frame: drawn first, the shears blocked the page for most of a second on a phone
// while the GPU compiled them in the middle of a frame (KHR_parallel_shader_compile lets the browser do it aside).
// Each program's uniforms are then read once, a task per program: on first use that read is a round trip to the GPU
// per uniform, and it too used to land in the first frame.
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
export function Compile({ onReady }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let alive = true;
    // The studio's environment map is part of every program: wait for it (Studio bakes it a task later).
    const environment = async () => {
      while (alive && !scene.environment) await nextTask();
    };
    environment()
      .then(() => alive && gl.compileAsync(scene, camera))
      .catch(() => undefined) // a failed compile surfaces again in the first frame, as before
      .then(async () => {
        for (const program of gl.info.programs ?? []) {
          if (!alive) return;
          program.getUniforms();
          await nextTask();
        }
      })
      .then(() => alive && onReady());
    return () => {
      alive = false;
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

// The loop is on demand: the first frame once the shaders are in.
export function Ready() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => invalidate(), [invalidate]);
  return null;
}

// Frame budget for as long as the shears move: they hand over to the 2D shears when they keep missing it.
export function FrameWatch({ onSlow }) {
  const state = useRef({ frames: 0, slow: 0, misses: 0 });
  useFrame((_, delta) => {
    const ms = delta * 1000;
    if (ms > WATCH.gapMs) return;
    const s = state.current;
    s.frames += 1;
    if (ms > WATCH.slowMs) s.slow += 1;
    if (s.frames < WATCH.window) return;
    s.misses = s.slow / s.frames > WATCH.share ? s.misses + 1 : 0;
    s.frames = 0;
    s.slow = 0;
    if (s.misses >= WATCH.misses) onSlow();
  });
  return null;
}

// Mounts once the model has loaded: forces PROBE.frames renders and calls onSlow when the median
// requestAnimationFrame delta, ignoring the first PROBE.skip, is above PROBE.slowMs.
export function FrameProbe({ onSlow }) {
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
