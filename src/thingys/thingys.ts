import * as THREE from 'three'
import { visibleSizeAtZDepth } from '../util/perspective-utilities';
import * as Scene from '../util/scene'
import { starConfig } from '../util/scene-configs'
import { bufAttrArrFromThingy } from './thingy-helpers';

export type Thingy = {
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    //acceleration: THREE.Vector3;
    maxVelocity?: number,
    maxAcceleration?: number,
}

export let thingys: Thingy[] = [], thingyPoints: THREE.Points;

export function init(numThingys: number) {

    // Check if number of thingies valid
    if (!numThingys) { console.error("Positive number of Thingys required"); return; }

    
    const { visibleWidth, visibleHeight } = visibleSizeAtZDepth(1000, Scene.camera); // Getting the visible size in space at depth 0 


    let initPositions = [];
    // Setup thingys
    for (let i = 0; i < numThingys; i++) {

        const depth = (Math.random() * starConfig.maxDepth);
        const x = (Math.random() - 0.5) * visibleWidth * 2;
        const y = (Math.random() - 0.5) * visibleHeight * 2;
        thingys.push({
            position: new THREE.Vector3(x, y, depth),
            velocity: new THREE.Vector3(0, 0, 1),
            //acceleration: new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5);
        });

        initPositions.push(x, y, depth);
    }
    // Thingys as particles
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', bufAttrArrFromThingy(thingys));
    const material = new THREE.PointsMaterial({ size: 0.5 });
    thingyPoints = new THREE.Points(geometry, material)
    Scene.scene.add(thingyPoints);
    
    console.debug("Completed thingys initialisation...");
}


export function wrapStarThingys(thingys: Thingy[], depth: number) {

    let { visibleWidth, visibleHeight } = visibleSizeAtZDepth(depth, Scene.camera);

    thingys.forEach(thingy => {
        if (Scene.frustum.containsPoint(thingy.position)) return;
        thingy.position.set(
            (-visibleWidth/2) + (Math.random() * visibleWidth),
            (-visibleWidth/2) + (Math.random() * visibleHeight),
            depth );
    });
}