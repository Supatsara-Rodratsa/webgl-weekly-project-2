varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 screenCoord = position.xy / u_resolution;
  vec3 waveOffset = vec3(sin(u_time * 2.0 + screenCoord.x * 10.0), cos(u_time * 2.0 + screenCoord.y * 10.0), 0.0);
  vec3 transformedPosition = position + (waveOffset * 0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
  v_uv = uv;
}