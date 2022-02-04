import { useLayoutEffect, useRef, useState } from "react";
import "./App.css";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import edgeExtraction from "./models/EdgeExtraction";
import initGPUComputationRenderer from "./modules/InitGPUComputationRenderer";

/* @ts-ignore */
import hand from "./models/hand_v2.obj";
import vertex from "./shaders/vertex.js";
import fragment from "./shaders/fragment.js";

// Post-processing
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const App = () => {
	const mountRef = useRef<HTMLDivElement>(null);
	const WIDTH = 256;

	const bloomParams = {
		exposure: 1,
		bloomStrength: 0.7,
		bloomThreshold: 0,
		bloomRadius: 1,
	};



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
		camera.position.z = -10; // Move camera back
		new OrbitControls(camera, renderer.domElement);

		// Set renderer size and add to react div
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		mountRef.current.appendChild(renderer.domElement);

		const { gpuCompute, positionVariable, velocityVariable } =
			initGPUComputationRenderer(WIDTH, renderer);

		// Load object(s)
		let edgeGeom: THREE.BufferGeometry;
		const setVertexTextures = (geometry: THREE.BufferGeometry) => {
			let edgeData = geometry.attributes.position.array;
			let count = edgeData.length;

			const dtEdgeStarts = gpuCompute.createTexture();
			const dtEdgeEnds = gpuCompute.createTexture();

			const startData = dtEdgeStarts.image.data;
			const endData = dtEdgeEnds.image.data;

			for ( let i = 0; i < startData.length; i+=4) {
				const j = ((6*i) / 4) % count;

				startData[i] = edgeData[j];
				startData[i+1] = edgeData[j+1];
				startData[i+2] = edgeData[j+2];
				startData[i+3] = 1;

				endData[i] = edgeData[j+3];
				endData[i+1] = edgeData[j+4];
				endData[i+2] = edgeData[j+5];
				endData[i+3] = 1;
			}
			
			dtEdgeStarts.image.data.set(startData);
			dtEdgeEnds.image.data.set(endData);
			dtEdgeStarts.needsUpdate = true;
			dtEdgeEnds.needsUpdate = true;

			velocityVariable.material.uniforms['edgeStartTexture'] = { value: dtEdgeStarts };
			velocityVariable.material.uniforms['edgeEndTexture'] = { value: dtEdgeEnds };
			positionVariable.material.uniforms['edgeStartTexture'] = { value: dtEdgeStarts };
			positionVariable.material.uniforms['edgeEndTexture'] = { value: dtEdgeEnds };
			velocityVariable.material.uniformsNeedUpdate = true;
		};

		edgeExtraction(hand).then((edges) => {
			edgeGeom = edges;
			setVertexTextures(edgeGeom);
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

			// if(edgeGeom) {
			// 	edgeGeom.rotateY(0.005);
			// 	edgeGeom.rotateZ(0.005);
			// 	setVertexTextures(edgeGeom);
			// }

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
			renderer.setSize(window.innerWidth, window.innerHeight);
			camera.updateProjectionMatrix();
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
