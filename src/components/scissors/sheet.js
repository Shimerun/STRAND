import { Plane, Vector3 } from 'three';

// The hero photo as a sheet the 3D shears cut through, lying just behind the pivot (world z = SHEET_Z).
const EPS = 0.04; // world units: shut blades stay in front of the sheet
const DEPTH = 3; // world units the sheet drops back with nothing to cut: behind the whole model
const SHADOW_OPACITY = 0.45;
export const SHEET_Z = -EPS;

/**
 * Returns update({ group, paper, gl, shadow }) for one frame. paper (0..1) brings the sheet up to the pivot:
 * whatever lies behind it AND on the blade side of the pivot is clipped (clipIntersection), so the blade
 * that opens backwards slips under the photo while the handles stay whole; the shadow catcher on the sheet
 * takes the shears' shadow. With paper = 0 nothing is clipped and no shadow map is drawn.
 */
export function createSheet() {
  const planes = [new Plane(new Vector3(0, 0, 1), EPS + DEPTH), new Plane()];
  const blade = new Vector3();
  let attached = false;

  // The model loads after the rig mounts, so its materials are picked up on the first frame they exist.
  function attach(group) {
    group.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      [object.material].flat().forEach((material) => {
        material.clippingPlanes = planes;
        material.clipIntersection = true;
        material.needsUpdate = true;
      });
      attached = true;
    });
  }

  return function update({ group, paper, gl, shadow }) {
    if (!attached) attach(group);
    planes[0].constant = EPS + DEPTH * (1 - paper);
    blade.set(0, 1, 0).transformDirection(group.matrixWorld); // the model's blades point +Y
    planes[1].normal.copy(blade).negate();
    planes[1].constant = blade.dot(group.position);
    gl.shadowMap.autoUpdate = paper > 0;
    if (shadow) {
      shadow.visible = paper > 0;
      shadow.material.opacity = SHADOW_OPACITY * paper;
    }
  };
}
