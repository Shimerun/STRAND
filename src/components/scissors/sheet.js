import { Box3, Matrix4, Plane, Vector3 } from 'three';

// The hero photo as a sheet of paper the 3D shears cut: it lies between the two halves, so from the camera's
// side the upper half is seen whole and the lower blade is under the paper, the way a real sheet sits between
// the blades. The shadow catcher (world z = SHEET_Z) takes the upper half's shadow.
const EPS = 0.04; // world units: the catcher sits just behind the upper half, never z-fighting it
const SHADOW_OPACITY = 0.45;
export const SHEET_Z = -EPS;

/** Bounding box of `node` (or the whole model) in the model root's own space. */
export function boxInRoot(root, node = root) {
  root.updateWorldMatrix(true, true);
  const toRoot = new Matrix4().copy(root.matrixWorld).invert();
  const relative = new Matrix4();
  const box = new Box3();
  const part = new Box3();
  node.traverse((object) => {
    if (!object.isMesh) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    part.copy(object.geometry.boundingBox).applyMatrix4(relative.multiplyMatrices(toRoot, object.matrixWorld));
    box.union(part);
  });
  return box;
}

/**
 * Which of the two animated halves lies under the other along the model's z (the screw axis, towards the
 * camera once mounted), and the z of the plane between them, in model space. clip: the Snip animation.
 */
export function findUnderHalf(root, clip) {
  const halves = clip.tracks.map((track) => root.getObjectByName(track.name.split('.')[0])).filter(Boolean);
  if (halves.length < 2) return null;
  const boxes = halves.map((half) => boxInRoot(root, half));
  const [lower, upper] = boxes[0].min.z + boxes[0].max.z < boxes[1].min.z + boxes[1].max.z ? [0, 1] : [1, 0];
  return { under: halves[lower], z: (boxes[lower].max.z + boxes[upper].min.z) / 2 };
}

/**
 * Returns update({ group, paper, gl, shadow }) for one frame. The lower half's meshes are clipped where they
 * are under the sheet AND beyond a point that slides from the tip (paper = 0: nothing clipped) to the pivot
 * (paper = 1: the whole lower blade is under the paper), so the blade slips under the sheet tip first while
 * the handles stay whole. Clipped parts cast no shadow. Shears.jsx names the half and the plane between the
 * halves in scene.userData.sheet = { under, z } (z in the rig group's local space).
 */
export function createSheet() {
  const planes = [new Plane(), new Plane()];
  const blade = new Vector3();
  const normal = new Vector3();
  const point = new Vector3();
  let sheet = null;

  // The model loads after the rig mounts, so it is picked up on the first frame it exists.
  function attach(group) {
    group.traverse((object) => {
      if (!object.userData.sheet) return;
      sheet = object.userData.sheet;
    });
    if (!sheet) return;
    group.traverse((object) => {
      if (object.isMesh) object.castShadow = true;
    });
    sheet.under.traverse((object) => {
      if (!object.isMesh) return;
      // Materials are shared with the upper half, so the lower half gets its own clipped copies.
      // A remount (StrictMode, HMR) finds the copies already in place and only points them at these planes.
      const clipped = [object.material].flat().map((material) => {
        const copy = material.userData.sheetClip ? material : material.clone();
        copy.userData.sheetClip = true;
        copy.clippingPlanes = planes;
        copy.clipIntersection = true;
        copy.clipShadows = true;
        return copy;
      });
      object.material = Array.isArray(object.material) ? clipped : clipped[0];
    });
  }

  return function update({ group, paper, gl, shadow }) {
    if (!sheet) attach(group);
    if (sheet) {
      // Under the sheet: behind the plane between the halves, which turns with the shears.
      normal.set(0, 0, 1).transformDirection(group.matrixWorld);
      point.set(0, 0, sheet.z);
      group.localToWorld(point);
      planes[0].setFromNormalAndCoplanarPoint(normal, point);
      // Beyond the slide point along the blades (the model's blades point +Y, the tip at y = half the length).
      blade.set(0, 1, 0).transformDirection(group.matrixWorld);
      point.set(0, sheet.tip * (1 - paper), 0);
      group.localToWorld(point);
      planes[1].setFromNormalAndCoplanarPoint(normal.copy(blade).negate(), point);
    }
    gl.shadowMap.autoUpdate = paper > 0;
    if (shadow) {
      shadow.visible = paper > 0;
      shadow.material.opacity = SHADOW_OPACITY * paper;
    }
  };
}
