import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { ImageBitmapLoader, Texture, Vector2, Vector4 } from 'three';
import { fragmentShader, vertexShader } from './shaders.js';

const SEGMENTS = 24; // enough for a smooth bend
const RADIUS = 6; // px, theme borderRadius
// As in PhotoReveal, which this plane stands in for: where the photo opens from (shares of the frame closed on
// [top, right, bottom, left]), its zoom while opening and its drift inside the frame over the whole pass.
const OPEN_FROM = { sides: [0, 0.3, 0, 0.3], left: [0, 0.55, 0, 0], right: [0, 0, 0, 0.55], bottom: [0.45, 0, 0, 0] };
const ZOOM = { from: 1.25, rest: 1.1 };
const DRIFT = 0.04;
const MARGIN = 120; // px past the viewport a plane is still drawn: the bend reaches beyond its frame
const MAX_TEXTURE_PX = 1280; // taller photos are scaled down while decoding to keep GPU memory low
const MAX_ANISOTROPY = 4;
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

// createImageBitmap options. Flipped here because WebGL cannot flip an ImageBitmap on upload.
const bitmapOptions = (height) => ({
  imageOrientation: 'flipY',
  premultiplyAlpha: 'none',
  ...(height > MAX_TEXTURE_PX ? { resizeHeight: MAX_TEXTURE_PX, resizeQuality: 'medium' } : undefined),
});

/**
 * One works photo as a plane that follows its DOM frame (frames.current.get(index)) every frame. The photo is
 * decoded (and scaled down, when `height` says it is large) off the main thread, so its arrival never stalls
 * the scroll. Once the texture is ready the DOM photo is hidden (it stays for clicks, focus and screen
 * readers) and shown again when the plane goes away. strength: ref with the smoothed scroll speed, -1..1.
 */
export default function WorkPlane({ src, height, index, frames, strength }) {
  const bitmap = useLoader(ImageBitmapLoader, src, (loader) => loader.setOptions(bitmapOptions(height)));
  const mesh = useRef(null);
  const size = useThree((state) => state.size);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const texture = useMemo(() => {
    const next = new Texture(bitmap);
    next.flipY = false; // already flipped, see bitmapOptions
    next.anisotropy = Math.min(MAX_ANISOTROPY, gl.capabilities.getMaxAnisotropy());
    next.needsUpdate = true;
    return next;
  }, [bitmap, gl]);
  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uSize: { value: new Vector2(1, 1) },
      uImageAspect: { value: bitmap.width / bitmap.height },
      uStrength: { value: 0 },
      uZoom: { value: ZOOM.from },
      uDrift: { value: 0 },
      uInset: { value: new Vector4() },
      uRadius: { value: RADIUS },
    }),
    [texture, bitmap],
  );

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    const frame = frames.current.get(index);
    if (frame) frame.style.opacity = '0';
    invalidate(); // the canvas draws on demand: the plane must be there in the frame the DOM photo goes
    return () => {
      const current = frames.current.get(index) ?? frame;
      if (current) current.style.opacity = '';
    };
  }, [texture, frames, index, invalidate]);

  useFrame(() => {
    const frame = frames.current.get(index);
    const plane = mesh.current;
    const rect = frame?.getBoundingClientRect();
    plane.visible = Boolean(rect) && rect.width > 0 && rect.bottom > -MARGIN && rect.top < size.height + MARGIN;
    if (!plane.visible) return;

    plane.position.set(rect.left + rect.width / 2 - size.width / 2, size.height / 2 - rect.top - rect.height / 2, 0);
    plane.scale.set(rect.width, rect.height, 1);

    const open = clamp01((size.height - rect.top) / (size.height / 2 + rect.height / 2));
    const pass = clamp01((size.height - rect.top) / (size.height + rect.height));
    const closed = 1 - open;
    const [top, right, bottom, left] = OPEN_FROM[frame.dataset.from] ?? OPEN_FROM.sides;
    uniforms.uSize.value.set(rect.width, rect.height);
    uniforms.uInset.value.set(top * closed, right * closed, bottom * closed, left * closed);
    uniforms.uZoom.value = ZOOM.from + (ZOOM.rest - ZOOM.from) * open;
    uniforms.uDrift.value = (pass * 2 - 1) * DRIFT;
    uniforms.uStrength.value = strength.current;
  });

  return (
    <mesh ref={mesh} frustumCulled={false}>
      <planeGeometry args={[1, 1, SEGMENTS, SEGMENTS]} />
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthTest={false} depthWrite={false} />
    </mesh>
  );
}
