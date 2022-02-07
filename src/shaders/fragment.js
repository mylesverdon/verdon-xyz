export default
`

uniform float time;
uniform float progress;
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;

void main()
{
    gl_FragColor = vec4(1., 1., 1., 1.);
} 


`