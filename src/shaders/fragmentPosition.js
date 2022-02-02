

export default 
`

uniform float time;
uniform float delta;
uniform sampler2D edgeStart;

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 position = texture2D( edgeStart, uv ).xyz;
    vec3 velocity = texture2D( velocityTexture, uv).xyz;

    gl_FragColor = vec4( position, 1.0 );

}

`