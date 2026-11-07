# Stage 1b-3 — Fallback and performance

## `ScissorsFallback.jsx` (2D SVG)
Same shears, same motion (it reads the same rig values: position, rotation, per-half angle, fade-out, `data-scissors-end` behaviour), moved with `transform` and `opacity` only. Styled to still look metallic: steel `linearGradient` on the blades, a white highlight stroke on the upper edges, black gradient handles, an accent (`#6B7F5E`) pivot and a soft `drop-shadow`.

## When the fallback is used (any of these)
- No WebGL (try creating a context once), or the context is lost: listen to `webglcontextlost` on the canvas (`preventDefault()`, then switch to the fallback).
- `prefers-reduced-motion`: a static pair in the hero only, no travel, no motion.
- `navigator.connection?.saveData`.
- **Frame-time probe** (replaces any `hardwareConcurrency` check, which is unreliable in Safari): after the model has rendered once, force `invalidate()` for 30 frames and measure `requestAnimationFrame` deltas, ignore the first 5; if the median is above 30 ms switch to the fallback. Remember the verdict in `sessionStorage` (`strand-3d=off`) so the next page view skips the 3D chunk entirely.
Gate the whole 3D import behind these checks where they can run before loading it (reduced motion, saveData, session verdict, WebGL probe).

## Cleanup and budget
- Dispose geometries, materials and textures on unmount; `scene.environment` texture and `PMREMGenerator` are already disposed in 1b-1.
- Budget: the 3D code chunk ≤ 300 KB gzip (the model file is loaded separately and lazily). Read the number from the build output. If it is over, first check for non-named imports from `three` or `@react-three/drei` and fix those; if it is still over, report the number to me. Do NOT cut features on your own.
- Verify with the build output only; do not open images or the model file.

`npm run build` once, update Progress as "1b-3", commit, report (include the 3D chunk gzip size).
