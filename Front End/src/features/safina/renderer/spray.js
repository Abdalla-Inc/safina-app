import * as THREE from "three";
import { waveGLSL } from "./ocean.js";
export function createSpray() {
  const count = 240,
    geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3),
    seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seeds[i * 3] = (i * 0.61803398875) % 1;
    seeds[i * 3 + 1] = (i * 0.41421356237) % 1;
    seeds[i * 3 + 2] = (i * 0.73205080757) % 1;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 3));
  const uniforms = {
    uTime: { value: 0 },
    uWeather: { value: 0.45 },
    uTravel: { value: 0 },
    uBuilt: { value: 30 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `attribute vec3 seed;uniform float uTime;uniform float uWeather;uniform float uTravel;uniform float uBuilt;varying float vAlpha;${waveGLSL}
    void main(){
      float age=fract(uTime*(.65+seed.y*.4)+seed.x);
      float side=seed.z>.5?1.:-1.;
      float burst=smoothstep(.0,.13,age)*(1.-smoothstep(.4,1.,age));
      vec2 launch=vec2(5.8-seed.y*2.,side*(.7+seed.y*.8));
      vec3 p=vec3(launch.x-age*(1.5+uWeather*3.),0.,launch.y+side*age*(.8+uWeather*1.3));
      p.y=swell(launch)+sin(age*3.14159)*(.15+uWeather*1.1+seed.z*.5);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp((18.+seed.z*27.)/-mv.z,1.,4.);
      vAlpha=burst*(.04+uWeather*uWeather*.40)*step(6.,uBuilt);
    }`,
    fragmentShader: `varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.2,1.,r))*vAlpha;if(a<.01)discard;gl_FragColor=vec4(.58,.72,.8,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return {
    points,
    update(time, weather, travel, built) {
      uniforms.uTime.value = time;
      uniforms.uWeather.value = weather;
      uniforms.uTravel.value = travel;
      uniforms.uBuilt.value = built;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
