// Shared by everything drawn in WebGL (the shears, the works grid): can this device do it, and has it
// already proved too slow in this session.
const VERDICT = { key: 'strand-3d', off: 'off' };

// Creates one context and releases it right away. Some sandboxed browsers throw instead of returning null.
export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

// sessionStorage throws when site storage is blocked; the verdict is then simply not remembered.
export function isWebGLOff() {
  try {
    return sessionStorage.getItem(VERDICT.key) === VERDICT.off;
  } catch {
    return false;
  }
}

export function rememberWebGLOff() {
  try {
    sessionStorage.setItem(VERDICT.key, VERDICT.off);
  } catch {
    // Storage blocked: the frame-time probe simply runs again on the next page view.
  }
}
