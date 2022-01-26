export default
`

uniform float time;
uniform float delta;

const float SEPARATION = 20.;
const float ALIGNMENT = 20.;
const float COHESION = 20.;

const float zoneRadius = 0.3;

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( positionTexture, uv );
    vec3 position = tmpPos.xyz;
    vec3 velocity = texture2D( velocityTexture, uv ).xyz;

    vec3 targetPos, targetVel, targetDir;
    float targetDist, targetDistSquared;
    vec3 selfPos = texture2D(positionTexture, uv).xyz;

    vec3 origin = vec3(0., 0., 0.);
    vec3 dirToOrigin = selfPos - origin;

    vec2 targetUV;

    velocity -= dirToOrigin*30.;

    for ( float y = 0.0; y < resolution.y; y++) {
        for (float x = 0.0; x < resolution.x; x++) {

            targetUV = vec2(x, y) / resolution.xy;
            targetPos = texture2D(positionTexture, targetUV).xyz;
            targetDist = distance(selfPos, targetPos);

            if ( targetDist < 0.0001) continue;
            
            targetDir = normalize(selfPos - targetPos);

            if ( targetDist > zoneRadius) continue;
            
            targetDistSquared = targetDist * targetDist;
            
            if ( targetDist < 0.05) {
                velocity += targetDir; // Separate
            } else if ( targetDist < 0.5 ) {
                targetVel = texture2D(velocityTexture, targetUV).xyz;
                velocity += targetVel; // Align
            } else {
                velocity += targetDir; // Cohese
            }


        }
    }

    if (length(velocity) > 0.5) {
        velocity = normalize(velocity)*0.5;
    }

    gl_FragColor = vec4(velocity, 1.);

}
`