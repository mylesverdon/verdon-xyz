
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const EdgeExtraction = async (objURL: string) => {

    const loader = new OBJLoader();
    function loadObject(): Promise<THREE.EdgesGeometry> {
        return new Promise( (resolution, rejection) => {
            loader.load( 
                objURL, // resource URL
                ( object: any ) => resolution(new THREE.EdgesGeometry( object.children[0].geometry )), // called when resource is loaded
                ( xhr: any ) => console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' ), // called when loading is in progresses
                ( error: any ) => console.log( 'An error happened' ) // called when loading has errors
            );
        });   
    }
 
    return loadObject();


}

export default EdgeExtraction;