// ! I WAS STUPID AND FORGOT THAT MODULES DONT CONTAIN SHARED VARIABLES FFS, GOTTA UNDO IT ALL

import './style.css'

import { bufAttrArrFromThingy } from './thingys/thingy-helpers';
import * as Scene from './util/scene'
import * as Thingys from './thingys/thingys'
import * as Config from './util/scene-configs'

// Sequence
//window.addEventListener("click", () => { changeToFlocking() });
Scene.init();
Thingys.init(Config.numThingys);

animate();

function animate() {
    requestAnimationFrame(animate);

    // Update thingys
    Thingys.thingys.forEach(thingy => {
        thingy.position.add(thingy.velocity);
    });
    Thingys.thingyPoints.geometry.setAttribute('position', bufAttrArrFromThingy(Thingys.thingys))
    Thingys.thingyPoints.geometry.attributes.position.needsUpdate = true;

    //THINGYS.wrapThingys(thingys, starConfig.maxDepth);

    // Update camera
    Scene.camera.position.x = Math.cos(Date.now() * 0.0005);
    Scene.camera.position.y = Math.sin(Date.now() * 0.001) / 3;

    Scene.renderer.render(Scene.scene, Scene.camera);
}

