import { Float32BufferAttribute } from "three";
import { Thingy } from './thingys'

function bufAttrArrFromThingy(thingys: Thingy[]) {
    let positions: number[] = [];
    thingys.forEach(thingy => {
        positions.push(thingy.position.x)
        positions.push(thingy.position.y)
        positions.push(thingy.position.z)
    });

    return new Float32BufferAttribute(positions, 3);
}


export { bufAttrArrFromThingy };