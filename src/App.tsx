import { useLayoutEffect, useRef, useState } from 'react';
import './App.css';

import * as THREE from "three";
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import edgeExtraction from './models/EdgeExtraction'

/* @ts-ignore */
import hand from './models/hand.obj';
import positionShader from "./shaders/fragmentPosition.js";
import velocityShader from "./shaders/fragmentVelocity.js";
import vertex from "./shaders/vertex.js";
import fragment from "./shaders/fragment.js";

// Post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


const App = () => {
    
    const mountRef = useRef<HTMLDivElement>(null);
    const WIDTH = 32;

    const bloomParams = {
        exposure: 1,
        bloomStrength: 1.5,
        bloomThreshold: 0,
        bloomRadius: 1
    };

    const [ edgeData, setEdgeData ] = useState([]);

    useLayoutEffect(() => {
        let velocityVariable: any, positionVariable: any;

        if (!mountRef?.current) return;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        var renderer = new THREE.WebGLRenderer();
        camera.position.z = 5; // Move camera back a lil

        const light = new THREE.PointLight(0x00AAAA);
        const ambLight = new THREE.AmbientLight(0xFF0000, 0.2);
        scene.add(light, ambLight);

        new OrbitControls(camera, renderer.domElement);
        // Set renderer size and add to react div
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Init GPGPU 
        const gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);
        const dtVelocity = gpuCompute.createTexture();
        const dtPosition = gpuCompute.createTexture();

        // Fill initial positions
        let velArr = dtVelocity.image.data;
        for (let i = 0; i < velArr.length; i = i + 4) {
            [velArr[i], velArr[i + 1], velArr[i + 2], velArr[i + 3]] = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, 1];
        }
        let posArr = dtPosition.image.data;
        for (let i = 0; i < posArr.length; i = i + 4) {
            [posArr[i], posArr[i + 1], posArr[i + 2], posArr[i + 3]] = [10 * (Math.random() - 0.5), 10 * (Math.random() - 0.5), 10 * (Math.random() - 0.5), 1];
        }

        // Set up position variable for computer texture
        velocityVariable = gpuCompute.addVariable('velocityTexture', velocityShader, dtVelocity);
        positionVariable = gpuCompute.addVariable('positionTexture', positionShader, dtPosition);

        gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
        gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);

        positionVariable.material.uniforms['time'] = { value: 0 };
        positionVariable.material.uniforms['delta'] = { value: 0 };
        velocityVariable.material.uniforms['time'] = { value: 0 };
        velocityVariable.material.uniforms['delta'] = { value: 0 };
        velocityVariable.material.uniforms['edgeGeometry'] = { value: 0 };
        velocityVariable.material.uniforms['delta'] = { value: 0 };


        // Load object(s)
        let dtEdges: THREE.DataTexture;
        edgeExtraction(hand).then((edges) => {
            const data = new Float32Array(edges.attributes.position.array);
            dtEdges = new THREE.DataTexture(data, WIDTH, WIDTH);
            edges.scale(0.1, 0.1, 0.1);
            let edgeLines = new THREE.LineSegments(edges);
            scene.add(edgeLines);

            let numEdges = edges.attributes.position.count;
            let counter = 0;
            setInterval(() => {
                counter = counter >= numEdges ? 0 : counter;
                edges.setDrawRange(counter,600);
                counter += 600;
            }, 100);
        });
        
        

        const error = gpuCompute.init(); // Initialising
        if (error !== null) console.error(error);

        // Setting up objects
        const material = new THREE.ShaderMaterial({
            uniforms: {
                positionTexture: { value: null },
                velocityTexture: { value: null },
                resolution: { value: new THREE.Vector4() },
            },
            vertexShader: vertex,
            fragmentShader: fragment
        });

        const geometry = new THREE.BufferGeometry();
        let positions = new Float32Array(WIDTH * WIDTH * 3);
        let reference = new Float32Array(WIDTH * WIDTH * 2);
        for (let i = 0; i < WIDTH * WIDTH; i++) {
            let [x, y, z] = [Math.random(), Math.random(), Math.random()];
            let [refX, refY] = [(i % WIDTH) / WIDTH, ~~(i / WIDTH) / WIDTH];
            positions.set([x, y, z], i * 3); // Setting an initial random position of each vertex
            reference.set([refX, refY], i * 2); // Setting a UV reference such that it can be accessed on the pos/vel texture
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 3));

        const points = new THREE.Points(geometry, material);
        scene.add(points);


        // Pos processing
        const composer = new EffectComposer( renderer );
        const renderPass = new RenderPass( scene, camera );
        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = bloomParams.bloomThreshold;
        bloomPass.strength = bloomParams.bloomStrength;
        bloomPass.radius = bloomParams.bloomRadius;
        composer.addPass( renderPass );
        composer.addPass( bloomPass );

        let time = 0;
        let last = 0;
        // Animation loop
        var animate = function () {

            requestAnimationFrame(animate);

            const now = performance.now();
            let delta = (now - last) / 1000;
            if (delta > 1) delta = 1; // safety cap on large deltas
            last = now;

            velocityVariable.material.uniforms.time = now;
            positionVariable.material.uniforms.time = now;
            velocityVariable.material.uniforms.delta = delta;
            positionVariable.material.uniforms.delta = delta;

            // Computer gpu renderer
            gpuCompute.compute();

            material.uniforms.positionTexture.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
            material.uniforms.velocityTexture.value = gpuCompute.getCurrentRenderTarget(velocityVariable).texture;

            composer.render();

        };
        animate(); // Start animation loop

        // Handle window resize
        let onWindowResize = function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener("resize", onWindowResize, false);

        return () => {
            if (mountRef?.current) mountRef.current.removeChild(renderer.domElement);
        }

    }, []); // Run effect once with []

    return (<div ref={mountRef}></div>); // Return div containing three canvas
}

export default App;