
export enum SceneStates {
    STARS,
    MURMURATIONS,
    SWIMMING,
}  

export let currentState: SceneStates = SceneStates.STARS 

export let numThingys = 10000;

export let flockingConfig = {
    velocityScale: 5,
    accelerationScale: 2,
}

export let starConfig = {
    maxDepth: 1000
}
