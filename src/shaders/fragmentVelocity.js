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

    vec3 targetStart = texture2D( edgeStartTexture, uv).xyz;
    vec3 targetEnd = texture2D( edgeEndTexture, uv).xyz;

    float interpolatedPosition = (sin(0.01*time*rand(uv))+1.)/2.;
    vec3 targetPos = targetStart + (targetEnd - targetStart)*interpolatedPosition;

    float approachSpeed = 0.;
    float targetDist = distance(targetPos,position);
    float nextDistance = distance(targetPos, (position + velocity));

    if (nextDistance != 0.) {
        approachSpeed = min(2.,targetDist / nextDistance);
    
    }
    velocity += (targetPos - position)*0.05;
    velocity -= velocity*(approachSpeed/50.);

    gl_FragColor = vec4(velocity, 1.);

}
`