

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

    vec3 targetStart = texture2D( edgeStartTexture, uv).xyz;
    vec3 targetEnd = texture2D( edgeEndTexture, uv).xyz;

    float interpolatedPosition = 0.5*(sin(0.01*time + 3.1415*rand(normalize(uv))));
    vec3 targetPos = targetEnd;

    gl_FragColor = vec4( targetPos, 1.0 );

}

`