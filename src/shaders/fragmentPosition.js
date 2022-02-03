

export default 
`

uniform float time;
uniform float delta;

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 position = texture2D( positionTexture, uv ).xyz;
    vec3 velocity = texture2D( velocityTexture, uv).xyz;

    gl_FragColor = vec4( position + velocity * delta, 1.0 );

}

`