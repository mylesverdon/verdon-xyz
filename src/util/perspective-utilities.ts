import { PerspectiveCamera, Camera } from "three";

export let visibleHeight: number, visibleWidth: number;

// Get the physical size of the camera view at a certain z depth 
export function visibleSizeAtZDepth(depth: number, camera: PerspectiveCamera) {
    // compensate for cameras not positioned at z=0
    const cameraOffset = camera.position.z;
    if (depth < cameraOffset) depth -= cameraOffset;
    else depth += cameraOffset;

    // vertical fov in radians
    const vFOV = camera.fov * Math.PI / 180;

    // Math.abs to ensure the result is always positive    
    visibleHeight = 2 * Math.tan(vFOV / 2) * Math.abs(depth);
    visibleWidth = visibleHeight * camera.aspect;
    return { visibleHeight, visibleWidth };

};
