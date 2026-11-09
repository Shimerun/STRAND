import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { BackSide, BoxGeometry, Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, Scene } from 'three';

// Studio from the reference viewer: a dark room lit by soft boxes, for crisp chrome reflections.
const ROOM = { size: 10, wall: 4.9, color: 0x232428, floor: 0x0c0c0d, blur: 0.035 };
// Ceiling strips facing down with dark gaps between them: [depth, z, intensity].
const CEILING = [[3.2, 3.2, 2.0], [2.0, 0.3, 0.9], [2.8, -3.0, 1.5]];
const CEILING_WIDTH = 9.6;
// Soft boxes facing the model: [width, height, x, y, z, intensity, color].
const SOFTBOXES = [
  [9.0, 2.2, 0, 2.75, 4.9, 2.0], // front, upper
  [9.0, 2.0, 0, 0.35, 4.9, 0.55], // dim zone behind the viewer: face-on steel reads grey, not white
  [9.0, 0.8, 0, -1.65, 4.9, 1.2], // low front strip
  [0.9, 7, -4.85, 0.4, 1.4, 2.8], // left strip
  [0.9, 7, 4.85, 0.4, 0.2, 2.0, 0xffefdc], // right strip, warm
  [5.0, 3.0, 0.8, 1.0, -4.9, 1.5], // back panel
];
const KEY_LIGHT = { position: [3, 6, 10], intensity: 0.6 }; // directional: only the direction matters
// The key light also casts the shears' shadow onto the hero photo while it is cut (sheet.js).
const SHADOW = { mapSize: 1024, extent: 8, near: 1, far: 30, bias: -0.0005, radius: 4 };

const glow = (intensity, color = 0xffffff) =>
  new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide });

function buildStudio() {
  const studio = new Scene();
  studio.add(new Mesh(new BoxGeometry(ROOM.size, ROOM.size, ROOM.size), new MeshBasicMaterial({ color: ROOM.color, side: BackSide })));
  const floor = new Mesh(new PlaneGeometry(ROOM.size, ROOM.size), new MeshBasicMaterial({ color: ROOM.floor }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -ROOM.wall;
  studio.add(floor);
  CEILING.forEach(([depth, z, intensity]) => {
    const strip = new Mesh(new PlaneGeometry(CEILING_WIDTH, depth), glow(intensity));
    strip.rotation.x = Math.PI / 2;
    strip.position.set(0, ROOM.wall, z);
    studio.add(strip);
  });
  SOFTBOXES.forEach(([width, height, x, y, z, intensity, color]) => {
    const box = new Mesh(new PlaneGeometry(width, height), glow(intensity, color));
    box.position.set(x, y, z);
    box.lookAt(0, 0, 0);
    studio.add(box);
  });
  return studio;
}

// Procedural environment map plus a soft key light; the studio scene is disposed right after baking.
export default function Studio() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const studio = buildStudio();
    const envMap = pmrem.fromScene(studio, ROOM.blur).texture;
    studio.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      object.material.dispose();
    });
    pmrem.dispose();
    scene.environment = envMap;
    return () => {
      scene.environment = null;
      envMap.dispose();
    };
  }, [gl, scene]);

  return (
    <directionalLight
      position={KEY_LIGHT.position}
      intensity={KEY_LIGHT.intensity}
      castShadow
      shadow-mapSize={[SHADOW.mapSize, SHADOW.mapSize]}
      shadow-camera-left={-SHADOW.extent}
      shadow-camera-right={SHADOW.extent}
      shadow-camera-top={SHADOW.extent}
      shadow-camera-bottom={-SHADOW.extent}
      shadow-camera-near={SHADOW.near}
      shadow-camera-far={SHADOW.far}
      shadow-bias={SHADOW.bias}
      shadow-radius={SHADOW.radius}
    />
  );
}
