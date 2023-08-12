uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture; 
uniform vec3 u_Color1;
uniform vec3 u_Color2;
uniform float u_wave;

#define PI 3.14

varying vec2 v_uv;

vec2 wave(vec2 st, float time) {
    st.y += cos(st.x * 2.0 + time);
    return st;
}

float line(vec2 st, float width) {
    return step(width, 1.0 - smoothstep(.0,1.,abs(sin(st.y*PI))));
}

void main() {
    // Normalize coordinates
    vec2 st = gl_FragCoord.xy / u_resolution.xy * v_uv;;
    st.x *= u_resolution.x / u_resolution.y;

    // Set Color
    vec3 color = mix(u_Color1, u_Color2, abs(cos(u_time)));

    st = wave(st * u_wave, u_time * 0.9);
    float lineEffect = line(st, 0.5);
    vec4 texColor = texture2D(u_texture, v_uv);
    color = mix(vec3(0.0), color, lineEffect);
    gl_FragColor = vec4(color * texColor.rgb * 1.9, 1.0);
}
