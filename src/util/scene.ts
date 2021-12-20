import * as THREE from 'three';

// Scene, Cam, Render, Control globals
export let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, frustum: THREE.Frustum;


export function init() {

    // Setting up scene, camera, renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.setZ(0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    //scene.add(ambientLight);

    // Fog
    scene.fog = new THREE.Fog(0, 500, 1000);

    frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);

    console.debug("Completed scene initialisation...");

}