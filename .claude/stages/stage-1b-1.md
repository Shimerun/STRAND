# Stage 1b-1 — The model and the hero pose (CHECKPOINT at the end)

Goal: big, beautiful, clearly visible 3D barber shears: the hero of the site. The model is MINE: `public/models/scissors.glb`. Do NOT rebuild, redraw, simplify, replace, open or print it. Keep its materials and textures; you may only tune `envMapIntensity` / `roughness` slightly if it renders too dark or flat.

## Install and files
`npm i three @react-three/fiber@8 @react-three/drei@9` (React 18!). Everything 3D loads through `React.lazy` + `Suspense`, mounted after first paint (`requestIdleCallback`, fallback `setTimeout(…, 200)`). From drei use only `useGLTF` (named import). Files in `src/components/scissors/`: `Scissors3D.jsx` (canvas + scene), `Shears.jsx` (model + `CONFIG`), `useScissorsRig.js` (scroll, pointer, idle), `ScissorsDebug.jsx` (dev only). `ScissorsFallback.jsx` comes in 1b-3, `CutReveal.jsx` in 4b.

## Inspect (do not open the file)
Run `npx --yes @gltf-transform/cli inspect public/models/scissors.glb` and read only its text. Note: node/mesh names, sizes in bytes, materials, textures, animations, compression. Then decide:
- **> ~2 MB**: make ONE optimised copy and keep the original. The default `optimize` FLATTENS and JOINS meshes, which would merge the two halves, so switch those steps off:
  `npx --yes @gltf-transform/cli optimize public/models/scissors.glb public/models/scissors.opt.glb --compress meshopt --texture-compress webp --flatten false --join false --palette false --instance false --simplify false --weld false`
  Then inspect the copy: mesh count and mesh/node names must equal the original. If not, delete the copy and load the original.
- **Two separate parts** (two blades or halves; identify them by node/mesh names, else by bounding boxes overlapping around the pivot): `halfA`, `halfB`.
- **Built-in open/close animation**: use drei `useAnimations` and drive `action.time` from the rig instead of rotating nodes by hand.
- **ONE fused mesh, no halves, no animation**: do not fake it. Show it static (hero float, scroll travel, gentle rocking) and tell me clearly that opening and snipping need a model with two separate halves.
- Decoder: Meshopt works by default. If Draco: `cp` the decoder files from `node_modules/three/examples/jsm/libs/draco/gltf/` into `public/draco/` and call `useGLTF.setDecoderPath('/draco/')`. Never a CDN.

## Normalise in `Shears.jsx` (never by editing the file)
One `<group>` and ONE config object at the top, so I can fix everything by changing one line:
```js
export const CONFIG = {
  ORIENTATION: [0, 0, 0], // Euler radians: blades point +Y, rings -Y, shears flat in the XY plane
  SCALE: 4,               // long axis in world units
  PIVOT: null,            // [x,y,z] in model space (screw / point between the halves); null = bounding-box centre
  MAX_OPEN: 30,           // max degrees PER HALF; I tune this by eye so the blades never cross
  SIGN_A: 1, SIGN_B: -1,  // flip a sign if a half opens the wrong way
};
```
Compute `Box3` once, centre the model on the pivot, scale the long axis to `SCALE`. **All angles in the whole spec are per half**: `halfA` rotates `+θ`, `halfB` rotates `-θ` around the pivot's Z axis (total opening = 2θ), closed = 0, clamped to `[0, MAX_OPEN]`. Rotate around the pivot, not around each part's origin: put each half in a `<group>` positioned at the pivot with the model offset inside. Never translate the halves. Do NOT try to detect the real opening range from geometry; `MAX_OPEN` is my decision.

## Dev helper `?debug` (dev builds only, loaded with a dynamic import, never in production)
`ScissorsDebug.jsx` shows an `axesHelper`, holds the shears open at `MAX_OPEN`, and listens for keys: arrows rotate `ORIENTATION` by 5° steps (Shift = 90°, Alt+arrows = Z), `[` `]` change `SCALE`, `,` `.` change `MAX_OPEN`, `1`/`2` flip `SIGN_A`/`SIGN_B`, `0` toggles open/closed. It prints the current `CONFIG` as copy-pasteable text on screen and in the console. Goal: I find the right values in one sitting and paste them into the file.

## Lighting (no network assets, no drei HDR presets)
Procedural `RoomEnvironment` (`three/examples/jsm/environments/RoomEnvironment.js`). In a component: `const { gl, scene } = useThree(); useEffect(() => { const pm = new THREE.PMREMGenerator(gl); const room = new RoomEnvironment(); /* add two tall thin white planes (0.6 × 12, colour multiplied ×30, MeshBasicMaterial, DoubleSide) at x = ±9, y = 2, z = 4, rotated ±(π/2.3) around Y, as strip lights */ const tex = pm.fromScene(room, 0.03).texture; scene.environment = tex; scene.environmentIntensity = 1; return () => { tex.dispose(); pm.dispose(); }; }, [])`. Canvas background transparent (never set `scene.background`). Renderer: `ACESFilmicToneMapping`, `toneMappingExposure = 1.05`. Add a rim `spotLight` from behind-right. It must look like real stainless steel: silver with soft gradients, never a black mirror.

## Canvas
Transparent (`alpha`), fixed overlay with `position:fixed; left:0; top:0; width:100vw; height:100vh; height:100lvh;` (large viewport height, so the iOS address bar never resizes the drawing buffer), `pointer-events:none`, z-index 40 (CLAUDE.md scale), `dpr={[1, 1.75]}`, `frameloop="demand"`, `antialias`, no shadow maps, no post-processing.

## Hero pose
Big and unmissable. Desktop: ≈ 60vh tall, right of centre, tilted about -35° on Z with a slight yaw. Mobile: ≈ 38vh, centred under the headline, hero text stays readable. Slow idle float (±0.06 units at 0.8 Hz) and sway (±12° yaw). Idle snip every ~2.8s: each half opens to `MAX_OPEN` in 0.35s and closes in 0.25s (ease in-out). Subtle pointer parallax toward the cursor, max 8°, lerp 0.08, only for `pointer: fine`. Keep the rig's state in `useScissorsRig` so 1b-2 can extend it.

## CHECKPOINT
Stop. Report the model summary (≤8 lines) and tell me how to run it (`npm run dev`, then `/?debug`). Run `npm run build` once, update Progress as "1b-1 (awaiting my visual OK)", commit.
