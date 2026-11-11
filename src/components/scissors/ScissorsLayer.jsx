import { lazy, Suspense, useCallback, useState } from 'react';
import { prefersReducedMotion } from '../../lib/scroll.js';
import { hasWebGL, isLowEndDevice, isWebGLOff, rememberWebGLOff } from '../../lib/webgl.js';
import ErrorBoundary from '../ErrorBoundary.jsx';
import CutReveal from './CutReveal.jsx';
import ScissorsFallback from './ScissorsFallback.jsx';

// The 3D chunk (three.js, R3F, the model) loads only when every check below passes.
const Scissors3D = lazy(() => import('./Scissors3D.jsx'));

const MODE = { webgl: 'webgl', flat: 'flat', still: 'still' };

function pickMode() {
  if (prefersReducedMotion()) return MODE.still;
  if (navigator.connection?.saveData || isLowEndDevice() || isWebGLOff() || !hasWebGL()) return MODE.flat;
  return MODE.webgl;
}

/** Signature shears: WebGL when the device can afford it, otherwise the 2D SVG fallback. */
export default function ScissorsLayer() {
  const [mode, setMode] = useState(pickMode);
  const toFlat = useCallback(() => setMode(MODE.flat), []);
  const toFlatForSession = useCallback(() => {
    rememberWebGLOff();
    setMode(MODE.flat);
  }, []);

  if (mode === MODE.still) return <ScissorsFallback still />;

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
