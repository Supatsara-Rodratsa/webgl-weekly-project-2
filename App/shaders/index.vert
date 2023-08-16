attribute float aTimeShift;
attribute float aScale;

uniform float uTime; 
uniform float uIntensity;

varying vec2 vUv;
varying float vIntensity;

void main(){
  gl_PointSize = aScale * 20.0;

  float t = uTime + aTimeShift;
  vec3 newPosition = position;

  newPosition.x += cos(t + sin(0.3 * t) + sin(0.4 * t));
  newPosition.y += cos(t + sin(0.6 * t) + sin(2.4 * t));
  newPosition.z += cos(t + sin(0.9 * t) + sin(1.3 * t));

  float intensity = distance(vec3(0.0), newPosition);
  intensity = smoothstep(0.0, uIntensity, intensity);
  vIntensity = intensity;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  vUv = uv;
}