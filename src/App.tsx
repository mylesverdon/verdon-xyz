import { useLayoutEffect, useRef, useState } from "react";
import "./App.css";

import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import edgeExtraction from "./models/EdgeExtraction";

/* @ts-ignore */
import hand from "./models/hand_v2.obj";
import positionShader from "./shaders/fragmentPosition.js";
import velocityShader from "./shaders/fragmentVelocity.js";
import vertex from "./shaders/vertex.js";
import fragment from "./shaders/fragment.js";

// Post-processing
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

const App = () => {
	const mountRef = useRef<HTMLDivElement>(null);
	const WIDTH = 32;

	const bloomParams = {
		exposure: 1,
		bloomStrength: 0.7,
		bloomThreshold: 0,
		bloomRadius: 1,
	};

	let lines: THREE.LineSegments;

	// on mouse move:
	function mouseMoved(e: any) {
		lines.rotation.y = (e.pageX - window.innerWidth / 2) / 1400;
		lines.rotation.x = -(100 + e.pageY - window.innerHeight / 2) / 1000;
	}
	//const [ edgeData, setEdgeData ] = useState([]);

	useLayoutEffect(() => {
		let velocityVariable: any, positionVariable: any;

		if (!mountRef?.current) return;

		var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		var renderer = new THREE.WebGLRenderer();
		camera.position.z = -15; // Move camera back a lil
		camera.rotateY(Math.PI);

		const light = new THREE.PointLight(0x00aaaa);
		const ambLight = new THREE.AmbientLight(0xff0000, 0.2);
		scene.add(light, ambLight);

		//new OrbitControls(camera, renderer.domElement);
		// Set renderer size and add to react div
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio( window.devicePixelRatio );
		mountRef.current.appendChild(renderer.domElement);

		mountRef.current.style.touchAction = 'none';
		mountRef.current.addEventListener('pointermove', mouseMoved);

		// Init GPGPU
		const gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);
		const dtVelocity = gpuCompute.createTexture();
		const dtPosition = gpuCompute.createTexture();

		// Fill initial positions
		let velArr = dtVelocity.image.data;
		for (let i = 0; i < velArr.length; i = i + 4) {
			[velArr[i], velArr[i + 1], velArr[i + 2], velArr[i + 3]] = [
				Math.random() - 0.5,
				Math.random() - 0.5,
				Math.random() - 0.5,
				1,
			];
		}
		let posArr = dtPosition.image.data;
		for (let i = 0; i < posArr.length; i = i + 4) {
			[posArr[i], posArr[i + 1], posArr[i + 2], posArr[i + 3]] = [
				10 * (Math.random() - 0.5),
				10 * (Math.random() - 0.5),
				10 * (Math.random() - 0.5),
				1,
			];
		}

		// Set up position variable for computer texture
		velocityVariable = gpuCompute.addVariable(
			"velocityTexture",
			velocityShader,
			dtVelocity
		);
		positionVariable = gpuCompute.addVariable(
			"positionTexture",
			positionShader,
			dtPosition
		);

		gpuCompute.setVariableDependencies(velocityVariable, [
			positionVariable,
			velocityVariable,
		]);
		gpuCompute.setVariableDependencies(positionVariable, [
			positionVariable,
			velocityVariable,
		]);

		positionVariable.material.uniforms["time"] = { value: 0 };
		positionVariable.material.uniforms["delta"] = { value: 0 };
		velocityVariable.material.uniforms["time"] = { value: 0 };
		velocityVariable.material.uniforms["delta"] = { value: 0 };
		velocityVariable.material.uniforms["edgeStart"] = { value: 0 };
		velocityVariable.material.uniforms["edgeEnd"] = { value: 0 };

		// Load object(s)
		let dtEdgeStarts, dtEdgeEnds: THREE.DataTexture;
		edgeExtraction(hand).then((edges) => {
			const linesShownIncrement = 100;
			edges.setDrawRange(0, 0);
			lines = new THREE.LineSegments(edges);
			scene.add(lines);
			const numEdges = edges.attributes.position.count;
			let i = 1;
			setInterval(() => {
				i = linesShownIncrement * i < numEdges + 1000 ? ++i : 0;
				edges.setDrawRange(0, linesShownIncrement * i);
			}, 80); // Fun line drawing stuff */
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
		//scene.add(points);

		// Pos processing
		const composer = new EffectComposer(renderer);

		const renderPass = new RenderPass(scene, camera);
		composer.addPass(renderPass);

		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			1.5,
			0.4,
			0.85
		);
		bloomPass.threshold = bloomParams.bloomThreshold;
		bloomPass.strength = bloomParams.bloomStrength;
		bloomPass.radius = bloomParams.bloomRadius;
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

			velocityVariable.material.uniforms.time = now;
			positionVariable.material.uniforms.time = now;
			velocityVariable.material.uniforms.delta = delta;
			positionVariable.material.uniforms.delta = delta;

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
			<div className="name">under active construction</div>
		</div>
	); // Return div containing three canvas
};

export default App;
