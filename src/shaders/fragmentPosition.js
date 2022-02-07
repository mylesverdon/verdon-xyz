

export default 
`

uniform float time;
uniform float delta;
uniform sampler2D edgeStartTexture;
uniform sampler2D edgeEndTexture;

float rand( vec2 co ){
    return fract( sin( dot( co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );
}

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 position = texture2D( positionTexture, uv ).xyz;
    vec3 velocity = texture2D( velocityTexture, uv).xyz;

    gl_FragColor = vec4( position + velocity*0.05, 1.0 );

}

`