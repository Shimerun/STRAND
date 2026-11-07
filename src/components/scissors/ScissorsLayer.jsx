import { lazy, Suspense, useCallback, useState } from 'react';
import { prefersReducedMotion } from '../../lib/scroll.js';
import ErrorBoundary from '../ErrorBoundary.jsx';
import ScissorsFallback from './ScissorsFallback.jsx';

// The 3D chunk (three.js, R3F, the model) loads only when every check below passes.
const Scissors3D = lazy(() => import('./Scissors3D.jsx'));

const MODE = { webgl: 'webgl', flat: 'flat', still: 'still' };
const VERDICT = { key: 'strand-3d', off: 'off' };

// sessionStorage throws when site storage is blocked; the verdict is then simply not remembered.
function isVerdictOff() {
  try {
    return sessionStorage.getItem(VERDICT.key) === VERDICT.off;
  } catch {
    return false;
  }
}

function rememberVerdictOff() {
  try {
    sessionStorage.setItem(VERDICT.key, VERDICT.off);
  } catch {
    // Storage blocked: the frame-time probe simply runs again on the next page view.
  }
}

// Creates one context and releases it right away. Some sandboxed browsers throw instead of returning null.
function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

function pickMode() {
  if (prefersReducedMotion()) return MODE.still;
  if (navigator.connection?.saveData || isVerdictOff() || !hasWebGL()) return MODE.flat;
  return MODE.webgl;
}

/** Signature shears: WebGL when the device can afford it, otherwise the 2D SVG fallback. */
export default function ScissorsLayer() {
  const [mode, setMode] = useState(pickMode);
  const toFlat = useCallback(() => setMode(MODE.flat), []);
  const toFlatForSession = useCallback(() => {
    rememberVerdictOff();
    setMode(MODE.flat);
  }, []);

  if (mode !== MODE.webgl) return <ScissorsFallback still={mode === MODE.still} />;

  return (
    <ErrorBoundary fallback={<ScissorsFallback />}>
      <Suspense fallback={null}>
        <Scissors3D onLost={toFlat} onSlow={toFlatForSession} />
      </Suspense>
    </ErrorBoundary>
  );
}
