import { useLayoutEffect, useRef, useState } from "react";
import "./App.css";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import edgeExtraction from "./models/EdgeExtraction";
import initGPUComputationRenderer from "./modules/InitGPUComputationRenderer";

/* @ts-ignore */
import hand from "./models/hand.obj";
import vertex from "./shaders/vertex.js";
import fragment from "./shaders/fragment.js";

// Post-processing
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const App = () => {
	const mountRef = useRef<HTMLDivElement>(null);
	const WIDTH = 32;

	const bloomParams = {
		exposure: 1,
		bloomStrength: 0.7,
		bloomThreshold: 0,
		bloomRadius: 1,
	};

	//const [ edgeData, setEdgeData ] = useState([]);

	useLayoutEffect(() => {

		if (!mountRef?.current) {
			console.error("Mount ref not valid.");
			return; // Ensure mount-ref is valid
		}

		var scene = new THREE.Scene();
		var renderer = new THREE.WebGLRenderer();
		var camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.z = 10; // Move camera back
		new OrbitControls(camera, renderer.domElement);

        // // Add light to scene
        // const light = new THREE.PointLight(0x00aaaa);
		// const ambLight = new THREE.AmbientLight(0xff0000, 0.2);
		// scene.add(light, ambLight);

        
		// Set renderer size and add to react div
		renderer.setSize(window.innerWidth, window.innerHeight);
		mountRef.current.appendChild(renderer.domElement);


		const { gpuCompute, positionVariable, velocityVariable } = initGPUComputationRenderer(WIDTH, renderer);


		// Load object(s)
		edgeExtraction(hand).then((edges) => {
			const startData = new Float32Array(WIDTH * WIDTH * 3);
			const endData = new Float32Array(WIDTH * WIDTH * 3);

			let edgeData = edges.attributes.position.array;
			let count = edgeData.length;

			for (let i = 0; i < count / 6; i += 6) {

				// Divide/increment by 8 because 2 in a pair and 4 in a vertex
				const j = (i / 6) * 4;
				
                startData[j] = edgeData[i];
				startData[j + 1] = edgeData[i + 1];
				startData[j + 2] = edgeData[i + 2];
				startData[j + 3] = 1;

				endData[j] = edgeData[i + 3];
				endData[j + 1] = edgeData[i + 4];
				endData[j + 2] = edgeData[i + 5];
				endData[j + 3] = 1;
			
            }

            // // Temp
            // let handGeom = new THREE.BufferGeometry();
            // handGeom.setAttribute('position', new THREE.Float32BufferAttribute(startData, 4));

            // let handPoints = new THREE.Points(
            //     handGeom,
            //     new THREE.PointsMaterial( {color: 0xFFFFFF} )
            // );
            // scene.add(handPoints);

			const dtEdgeStarts = new THREE.DataTexture(
				startData,
				WIDTH,
				WIDTH,
				THREE.Format,
				THREE.FloatType
			);

			const dtEdgeEnds = new THREE.DataTexture(endData, WIDTH, WIDTH);

			positionVariable.material.uniforms["edgeStart"] = {
				value: dtEdgeStarts,
			};
			positionVariable.material.uniforms["edgeEnd"] = {
				value: dtEdgeEnds,
			};
			velocityVariable.material.uniforms["edgeStart"] = {
				value: dtEdgeStarts,
			};
			velocityVariable.material.uniforms["edgeEnd"] = {
				value: dtEdgeEnds,
			};
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
			fragmentShader: fragment,
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
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("reference", new THREE.BufferAttribute(reference, 3));

		const points = new THREE.Points(geometry, material);
		scene.add(points);

		// Pos processing
		const composer = new EffectComposer(renderer);
		const renderPass = new RenderPass(scene, camera);
		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			1.5,
			0.4,
			0.85
		);
		bloomPass.threshold = bloomParams.bloomThreshold;
		bloomPass.strength = bloomParams.bloomStrength;
		bloomPass.radius = bloomParams.bloomRadius;
		composer.addPass(renderPass);
		composer.addPass(bloomPass);

		let time = 0;
		let last = 0;
		// Animation loop
		var animate = function () {
			requestAnimationFrame(animate);

			const now = performance.now();
			let delta = (now - last) / 1000;
			if (delta > 1) delta = 1; // safety cap on large deltas
			last = now;

			velocityVariable.material.uniforms.time = { value: now };
			positionVariable.material.uniforms.time = { value: now };
			velocityVariable.material.uniforms.delta = { value: delta };
			positionVariable.material.uniforms.delta = { value: delta };

			// Computer gpu renderer
			gpuCompute.compute();

			material.uniforms.positionTexture.value =
				gpuCompute.getCurrentRenderTarget(positionVariable).texture;
			material.uniforms.velocityTexture.value =
				gpuCompute.getCurrentRenderTarget(velocityVariable).texture;

			composer.render();
		};
		animate(); // Start animation loop

		// Handle window resize
		let onWindowResize = function () {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener("resize", onWindowResize, false);

		return () => {
			if (mountRef?.current) mountRef.current.removeChild(renderer.domElement);
		};
	}, []); // Run effect once with []

	return (
		<div>
			<div className="three-canvas" ref={mountRef} />
		</div>
	); // Return div containing three canvas
};

export default App;
