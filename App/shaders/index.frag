vec3 cosPalette(  float t,  vec3 a,  vec3 b,  vec3 c, vec3 d ){
    return a + b*cos( 6.28318*(c*t+d) );
}

varying float vRandom;
varying float vNoise;
varying vec2 vUv;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uTexture;


void main(){
  vec3 finalColor = mix(uColor1, uColor2, vRandom);
  vec4 texture = texture2D(uTexture, vUv * 3.0);

  vec3 brightness = vec3(0.5, 0.5, 0.5);
  vec3 contrast = vec3(0.5, 0.5, 0.5);
  vec3 oscilation = vec3(1.0, 1.0, 1.0);
  vec3 phase = vec3(0.0, 0.1, 0.2);
  vec3 final =  cosPalette(1.0 - vNoise, brightness, contrast, oscilation, phase);
  gl_FragColor = vec4(final, 0.9);
}