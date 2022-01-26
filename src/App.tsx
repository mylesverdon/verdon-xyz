import { useLayoutEffect, useRef } from 'react';
import './App.css';

import * as THREE from "three";
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
/* @ts-ignore */ import positionShader from "./shaders/fragmentPosition.js";
/* @ts-ignore */ import velocityShader from "./shaders/fragmentVelocity.js";
/* @ts-ignore */ import vertex from "./shaders/vertex.js";
/* @ts-ignore */ import fragment from "./shaders/fragment.js";



const App = () => {

    const mountRef = useRef<HTMLDivElement>(null);
    const WIDTH = 32;

    useLayoutEffect(() => {
        
        if(!mountRef?.current) return;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        var renderer = new THREE.WebGLRenderer();
        camera.position.z = 0.5; // Move camera back a lil

        const controls = new OrbitControls( camera, renderer.domElement );
        // Set renderer size and add to react div
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild( renderer.domElement );

        // Init GPGPU 
        const gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer);
        const dtVelocity = gpuCompute.createTexture();      
        const dtPosition = gpuCompute.createTexture();      

        // Fill initial positions
        let velArr = dtVelocity.image.data;
        for (let i = 0; i < velArr.length; i = i+4) {
            [velArr[i], velArr[i+1], velArr[i+2], velArr[i+3]] = [Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,1];
        }
        let posArr = dtPosition.image.data;
        for (let i = 0; i < posArr.length; i = i+4) { 
            [posArr[i], posArr[i+1], posArr[i+2], posArr[i+3]] = [Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,1];
        }


        // Set up position variable for computer texture
        const velocityVariable = gpuCompute.addVariable('velocityTexture', velocityShader, dtVelocity);
        const positionVariable = gpuCompute.addVariable('positionTexture', positionShader, dtPosition);
        
        gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
        gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );
        
        positionVariable.material.uniforms['time'] = {value: 0};
        velocityVariable.material.uniforms['time'] = {value: 0};

        const error = gpuCompute.init(); // Initialising
        if ( error !== null) console.error(error);

        // Setting up objects
       const material = new THREE.ShaderMaterial({ 
            extensions: {
                // @ts-ignore
                derivatives: `#extension GL_OES_standard_derivatives : enable`,
            },
            side: THREE.DoubleSide,
            uniforms: {
                time: { value: 0 },
                positionTexture: { value: null },
                velocityTexture: { value: null },
                resolution: { value: new THREE.Vector4() },
            },
            vertexShader: vertex,
            fragmentShader: fragment
        });
        const geometry = new THREE.BufferGeometry();
        let positions = new Float32Array(WIDTH*WIDTH*3);
        let reference = new Float32Array(WIDTH*WIDTH*2);
        for (let i = 0; i < WIDTH*WIDTH; i++) {
            let [x,y,z] = [Math.random(),Math.random(),Math.random()];
            let [refX, refY] = [(i%WIDTH)/WIDTH, ~~(i/WIDTH)/WIDTH];
            positions.set([x,y,z],i*3); // Setting an initial random position of each vertex
            reference.set([refX,refY],i*2); // Setting a UV reference such that it can be accessed on the pos/vel texture
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
        geometry.setAttribute('reference', new THREE.BufferAttribute(reference,3));

        const points = new THREE.Points(geometry, material);
        scene.add(points);


        let time = 0;
        // Animation loop
        var animate = function () {
            requestAnimationFrame(animate);
            time = time + 0.05;
            // Computer gpu renderer
            gpuCompute.compute();
            
            material.uniforms.positionTexture.value = 
                gpuCompute.getCurrentRenderTarget(positionVariable).texture;
            
            material.uniforms.velocityTexture.value = 
                gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
            
            material.uniforms.time.value = time;
            renderer.render(scene, camera);
            controls.update();
        };
        animate(); // init animation

        // Handle window resize
        let onWindowResize = function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        }
        window.addEventListener("resize", onWindowResize, false);


        return () => {
            if(mountRef?.current) mountRef.current.removeChild( renderer.domElement);
        }
        
    }, []); // Run effect once

    return ( <div ref={mountRef}></div> ); // Return div containing three canvas
}

export default App;
