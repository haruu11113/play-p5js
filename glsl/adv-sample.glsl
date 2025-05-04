# ifdef GL_ES
precision mediump float;
# endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main(){
    vec2 st = (gl_FragCoord.xy * 2. - u_resolution.xy) /
                        min(u_resolution.x, u_resolution.y);

    gl_FragColor = vec4(vec3(st.x, st.y, 0.), 1.0);
}
