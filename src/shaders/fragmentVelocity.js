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

    float interpolatedPosition = 0.5*(sin(time*rand(vec2(delta,time)*uv))+1.);
    vec3 targetPos = targetStart*interpolatedPosition + targetEnd*(1.-interpolatedPosition);

    float targetDist = distance(targetPos,position);

    float approachSpeed = 0.;
    float nextDistance = distance(targetPos, (position + velocity));

    if (nextDistance != 0.) {
        approachSpeed = targetDist / nextDistance;
    }
    velocity += (targetPos - position)*0.05;
    velocity -= velocity*(approachSpeed/50.);

    gl_FragColor = vec4(velocity, 1.);

}
`