export default
`

uniform float time;
uniform float delta;
uniform sampler2D edgeStart;
uniform sampler2D edgeEnd;

const float separationDistance = 1.; // 20
const float alignmentDistance = 2.; // 40
const float cohesionDistance = 4.; //

float zoneRadius = 40.;
float zoneRadiusSq = 1600.;

float separationThresh = 0.45;
float alignmentThresh = 0.65;

const float SPEED_LIMIT = 9.;

float rand( vec2 co ){
    return fract( sin( dot( co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );
}

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 position = texture2D( positionTexture, uv ).xyz;
    vec3 velocity = texture2D( velocityTexture, uv ).xyz;

    

    /* 
    
    zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
    separationThresh = separationDistance / zoneRadius;
    alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
    
    zoneRadiusSq = zoneRadius * zoneRadius;
    vec3 targetPos, targetVel, targetDir;
    float targetDist, targetDistSq, percent, factor;
    vec3 selfPos = texture2D(positionTexture, uv).xyz;

    vec3 origin = vec3(0., 0., 0.);
    vec3 dirToOrigin = selfPos - origin;

    const float PI = 3.14159;
    const float PI_2 = PI * 2.;
    
    velocity -= dirToOrigin * 0.01; // Move to centre

    vec2 targetUV;
    for ( float y = 0.0; y < resolution.y; y++) {
        for (float x = 0.0; x < resolution.x; x++) {

            targetUV = vec2(x, y) / resolution.xy;
            targetPos = texture2D(positionTexture, targetUV).xyz;
            targetDist = distance(selfPos, targetPos);
            targetDistSq = targetDist * targetDist;


            if ( targetDist < 0.00001) continue; // making sure no divide by 0
            
            targetDir = targetPos - selfPos;

            if ( targetDistSq > zoneRadiusSq) continue;
            
            targetDistSq = targetDist * targetDist;

            percent = targetDistSq / zoneRadiusSq;

            if ( percent < separationThresh ) {

                velocity -= normalize( targetDir ) * 0.000001;

            } else if ( percent < alignmentThresh ) {
            
                //Alignment - fly the same direction
                float threshDelta = alignmentThresh - separationThresh;
                float adjustedPercent = ( percent - separationThresh ) / threshDelta;

                targetVel = texture2D( velocityTexture, targetUV ).xyz;

                velocity += normalize( targetVel ) * 0.00001;
            
            } else {

                //Attraction / Cohesion - move closer
                float threshDelta = 1.0 - alignmentThresh;
                float adjustedPercent;
                if( threshDelta == 0. ) adjustedPercent = 1.;
                else adjustedPercent = ( percent - alignmentThresh ) / threshDelta;

                factor = targetDist * delta;
                // factor = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;

                velocity += targetDir * 0.001;

                // velocity += vec3(0.01, 0., 0.);

            }


        }
    }
    if ( length(velocity) > 2.) {
        velocity = normalize(velocity) * 2.;
    } */


    gl_FragColor = vec4(velocity, 1.);

}
`