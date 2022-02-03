import positionShader from "../shaders/fragmentPosition.js";
import velocityShader from "../shaders/fragmentVelocity.js";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer";

export default function initGPUComputationRenderer(
	WIDTH: number,
	renderer: THREE.WebGLRenderer
) {
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

	// Set up position/velocity variables for compute texture
	// and apply to gpuCompute dependencies (e.g. sharing outputs as texture uniforms)
	let velocityVariable = gpuCompute.addVariable(
		"velocityTexture",
		velocityShader,
		dtVelocity
	);
	let positionVariable = gpuCompute.addVariable(
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


	// Set up uniforms for each variable shader
	positionVariable.material.uniforms["time"] = { value: 0 };
	positionVariable.material.uniforms["delta"] = { value: 0 };
	velocityVariable.material.uniforms["time"] = { value: 0 };
	velocityVariable.material.uniforms["delta"] = { value: 0 };
	
	positionVariable.material.uniforms["edgeStartTexture"] = { value: 0 };
	velocityVariable.material.uniforms["edgeStartTexture"] = { value: 0 };
	positionVariable.material.uniforms["edgeEndTexture"] = { value: 0 };
	velocityVariable.material.uniforms["edgeEndTexture"] = { value: 0 };

	return { gpuCompute, positionVariable, velocityVariable };
}
