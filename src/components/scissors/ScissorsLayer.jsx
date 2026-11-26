import { lazy, Suspense, useCallback, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/useMediaQuery.js';
import { hasWebGL, isLowEndDevice, isWebGLOff, rememberWebGLOff } from '../../lib/webgl.js';
import ErrorBoundary from '../ErrorBoundary.jsx';
import CutReveal from './CutReveal.jsx';
import ScissorsFallback from './ScissorsFallback.jsx';

// The 3D chunk (three.js, R3F, the model) loads only when every check below passes, in steps: each module graph is
// evaluated in a task of its own, so no single task holds the page for long.
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
const Scissors3D = lazy(() =>
  import('three')
    .then(nextTask)
    .then(() => import('@react-three/fiber'))
    .then(nextTask)
    .then(() => import('./Scissors3D.jsx')),
);

const MODE = { webgl: 'webgl', flat: 'flat' };

function pickMode() {
  if (navigator.connection?.saveData || isLowEndDevice() || isWebGLOff() || !hasWebGL()) return MODE.flat;
  return MODE.webgl;
}

/**
 * Signature shears: WebGL when the device can afford it, otherwise the 2D SVG fallback. Reduced motion (followed
 * live) unmounts both for the still pair, which stops their frames and listeners.
 */
export default function ScissorsLayer() {
  const reduce = usePrefersReducedMotion();
  const [mode, setMode] = useState(pickMode);
  const toFlat = useCallback(() => setMode(MODE.flat), []);
  const toFlatForSession = useCallback(() => {
    rememberWebGLOff();
    setMode(MODE.flat);
  }, []);

  if (reduce) return <ScissorsFallback still />;

  return (
    <>
      <CutReveal />
      {mode === MODE.flat ? (
        <ScissorsFallback />
      ) : (
        <ErrorBoundary fallback={<ScissorsFallback />}>
          <Suspense fallback={null}>
            <Scissors3D onLost={toFlat} onSlow={toFlatForSession} />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}
