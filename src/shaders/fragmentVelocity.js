export default
`

uniform float time;
uniform float delta;
uniform sampler2D edgeStartTexture;
uniform sampler2D edgeEndTexture;


const float SPEED_LIMIT = 9.;

float rand( vec2 co ){
    return fract( sin( dot( co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );
}

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 position = texture2D( positionTexture, uv ).xyz;
    vec3 velocity = texture2D( velocityTexture, uv ).xyz;

    vec3 targetPos = texture2D( edgeStartTexture, uv).xyz;
    float targetDist = distance(targetPos,position);

    float approachSpeed = targetDist - distance(targetPos, (position + velocity));
    velocity += (targetPos - position);

    //velocity *= approachSpeed*0.0001;

    if ( length(velocity) > 2.) {
        velocity = normalize(velocity)*2.;
    }

    gl_FragColor = vec4(velocity, 1.);

}
`