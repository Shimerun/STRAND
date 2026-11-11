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

// Known before anything loads, so the 3D chunk and the model are never fetched for nothing: little memory
// (Chromium reports it in GB, rounded: 2 and below is a budget phone), a single or dual core, or a slow link.
// Safari reports none of these and is judged later by the frame-time probe, as before.
const LOW_END = { memoryGb: 2, cores: 2, links: ['slow-2g', '2g', '3g'] };
export function isLowEndDevice() {
  const { deviceMemory, hardwareConcurrency, connection } = navigator;
  return (
    (deviceMemory !== undefined && deviceMemory <= LOW_END.memoryGb) ||
    (hardwareConcurrency !== undefined && hardwareConcurrency <= LOW_END.cores) ||
    LOW_END.links.includes(connection?.effectiveType)
  );
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
