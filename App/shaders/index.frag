uniform sampler2D uTxt;
uniform vec3 uColor;

varying vec2 vUv;
varying float vIntensity;

void main(){
  vec2 uv = gl_PointCoord.xy;
  vec4 txt = texture2D(uTxt, uv);


  vec3 whiteColor = vec3(1.0, 1.0, 1.0);
  vec3 finalColor = mix(uColor, whiteColor, vIntensity);

  float a = txt.r * (1.0- vIntensity);
  
  gl_FragColor = vec4(finalColor, a);
}