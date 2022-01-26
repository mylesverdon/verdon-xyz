

export default 
`

uniform float time;
uniform float delta;

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( positionTexture, uv );
    vec3 position = tmpPos.xyz;
    vec3 velocity = texture2D( velocityTexture, uv).xyz;

    gl_FragColor = vec4( position + velocity*0.01, 1.0 );

}

`