import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { createShip } from "./ship.js";
import { WEATHER, sailingResponse } from "./weather.js";
import { waveGLSL, seaHeight } from "./ocean.js";
import { nightEnvironment } from "./lighting.js";
import { createSpray } from "./spray.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
const noiseGLSL = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.02+13.7;a*=.5;}return v;}`;
const waterShader = {
  name: "Safina reflective ocean",
  uniforms: {
    color: { value: new THREE.Color(0x092337) },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    uBuilt: { value: 30 },
    uWeather: { value: 0.45 },
    uTravel: { value: 0 },
  },
  vertexShader: `uniform mat4 textureMatrix;uniform float uTime;uniform float uWeather;uniform float uTravel;varying vec4 vMirror;varying vec3 vWorld;${waveGLSL}
void main(){vec3 displaced=position;vec3 world=(modelMatrix*vec4(position,1.)).xyz;displaced.z+=swell(world.xz);vMirror=textureMatrix*vec4(displaced,1.);vWorld=(modelMatrix*vec4(displaced,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(displaced,1.);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime;uniform float uBuilt;uniform float uWeather;uniform float uTravel;varying vec4 vMirror;varying vec3 vWorld;${noiseGLSL}${waveGLSL}
float height(vec2 p){return swell(p)+(.15+uWeather*.4)*(sin(p.x*2.5+p.y*1.9+uTime*1.4)*.055+noise(p*4.+uTime*.2)*.06);}
void main(){vec2 p=vWorld.xz;float e=.07;vec3 n=normalize(vec3((height(p-vec2(e,0))-height(p+vec2(e,0)))/(e*2.),1.,(height(p-vec2(0,e))-height(p+vec2(0,e)))/(e*2.)));
 vec3 view=normalize(cameraPosition-vWorld);float dist=length(cameraPosition-vWorld);float fresnel=.035+.91*pow(1.-max(0.,dot(view,n)),4.);
 vec2 uv=vMirror.xy/vMirror.w;vec2 distortion=n.xz*(.016+1./dist*.15);vec3 reflection=texture2D(tDiffuse,clamp(uv+distortion,vec2(.002),vec2(.998))).rgb;
 vec3 col=mix(vec3(.003,.014,.025),reflection*.90,fresnel);
 float face=max(0.,dot(n,normalize(vec3(-.4,.75,.5))));col+=vec3(.003,.012,.019)*face;
 float amp=.045+uWeather*uWeather*1.45;
 float crest=smoothstep(amp*.72,amp*1.38,swell(p)+noise(p*.63)*amp*.25);
 float turbulence=fbm(p*1.4+vec2(uTime*.45,-uTime*.16));
 float froth=smoothstep(.35,.68,turbulence)*(.35+.65*noise(p*8.+uTime*.3));
 col=mix(col,vec3(.23,.34,.39),crest*froth*uWeather*uWeather*.85);
 vec3 light=normalize(vec3(-.22,.30,-.9));float spec=pow(max(0.,dot(n,normalize(view+light))),160.);col+=vec3(.12,.18,.23)*spec;
 float fine=pow(max(0.,sin(p.x*4.8+p.y*3.4+fbm(p*.7)*6.+uTime*1.1)),22.);col+=fine*vec3(.002,.004,.006)*exp(-dist*.035);
 // Hull foam and the diverging wake advect astern while the camera tracks the ship.
 float hullZ=.86*pow(max(.0,sin(3.14159*(.085+(p.x+7.1)/14.*.915))),.62)*2.08;
 float side=exp(-pow((abs(p.y)-hullZ)/.19,2.))*step(-7.,p.x)*step(p.x,7.);
 float aft=max(0.,-p.x-6.);float wake=exp(-pow((abs(p.y)-(.7+aft*.19))/.28,2.))*exp(-aft*.10)*step(p.x,-5.8);
 float bubble=smoothstep(.47,.72,noise(vec2(p.x*6.+uTime*5.,p.y*15.)));
 col+=(side*.12+wake*.15)*(.35+uWeather*1.4)*bubble*vec3(.38,.53,.58)*step(5.,uBuilt);
 float fog=1.-exp(-dist*(.001+uWeather*.003));col=mix(col,vec3(.004,.013,.027),fog);
 gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`,
};
export function createScene(
  container,
  { reducedMotion = false, onError = () => {}, moonUrl = "/assets/moon-lroc-2k.jpg" } = {},
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "default",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1e32, 0.003);
  const environment = nightEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.8;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 700);
  const controls = new OrbitControls(camera, renderer.domElement);
  // Host uses accessible rotate buttons so the canvas never captures page scrolling.
  controls.enabled = false;
  renderer.domElement.style.touchAction = "pan-y";
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 20;
  controls.maxDistance = 65;
  controls.minPolarAngle = 0.84;
  controls.maxPolarAngle = 1.51;
  controls.rotateSpeed = 0.4;
  const target = new THREE.Vector3(0.65, 6.7, 0);
  function resetCamera() {
    const mobile = container.clientWidth < 600;
    camera.position.set(mobile ? 23 : 19, mobile ? 11 : 9, mobile ? 40 : 29);
    controls.target.copy(target);
    controls.update();
    invalidate();
  }
  scene.add(new THREE.HemisphereLight(0x819eb7, 0x111c22, 0.85));
  const moonLight = new THREE.DirectionalLight(0xa9cbe9, 3.1);
  moonLight.position.set(-16, 23, -18);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  Object.assign(moonLight.shadow.camera, {
    left: -16,
    right: 16,
    top: 18,
    bottom: -10,
    near: 1,
    far: 75,
  });
  moonLight.shadow.bias = -0.0002;
  moonLight.shadow.normalBias = 0.035;
  moonLight.shadow.radius = 2;
  scene.add(moonLight);
  const key = new THREE.DirectionalLight(0xffdcb2, 1.55);
  key.position.set(5, 10, 18);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x92bddf, 1.1);
  rim.position.set(16, 14, -8);
  scene.add(rim);
  const deckFill = new THREE.PointLight(0xffb85d, 38, 15, 2);
  deckFill.position.set(0, 4.2, 0.8);
  scene.add(deckFill);
  const ship = createShip();
  scene.add(ship.root);
  // Concentrate vertices around the ship; stretch the outer grid to the horizon.
  const seaGeometry = new THREE.PlaneGeometry(2, 2, 240, 240);
  const seaPositions = seaGeometry.attributes.position;
  const stretch = (v) =>
    ((Math.sign(v) * Math.expm1(Math.abs(v) * 4)) / Math.expm1(4)) * 900;
  for (let i = 0; i < seaPositions.count; i++) {
    seaPositions.setXY(
      i,
      stretch(seaPositions.getX(i)),
      stretch(seaPositions.getY(i)),
    );
  }
  seaGeometry.computeBoundingSphere();
  const ocean = new Reflector(seaGeometry, {
    textureWidth: container.clientWidth < 600 ? 512 : 1024,
    textureHeight: container.clientWidth < 600 ? 512 : 1024,
    clipBias: 0.003,
    multisample: 0,
    shader: waterShader,
  });
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.12;
  scene.add(ocean);
  const spray = createSpray();
  scene.add(spray.points);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uWeather: { value: 0.45 } },
    vertexShader:
      "varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec3 vPos;uniform float uTime;uniform float uWeather;${noiseGLSL}
void main(){vec3 p=normalize(vPos);float t=smoothstep(.0,.65,p.y);vec3 col=mix(vec3(.004,.013,.028),vec3(.0009,.0025,.008),t);vec3 moon=normalize(vec3(-.34,.27,-.91));float glow=pow(max(0.,dot(p,moon)),26.);col+=glow*vec3(.015,.026,.039);
 vec2 q=p.xz/(max(.055,p.y)+.2)*2.8;float base=fbm(q+vec2(uTime*(.002+uWeather*.02),0.));float cloud=smoothstep(.69-uWeather*.36,.84-uWeather*.27,base)*smoothstep(.01,.11,p.y)*(1.-smoothstep(.5,.85,p.y));float detail=fbm(q*2.8);vec3 cc=mix(vec3(.006,.017,.034),vec3(.034,.062,.09),detail*.5+glow*.8);col=mix(col,cc,cloud*.93);col*=1.-uWeather*.16;
 gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(500, 40, 24), skyMat));
  const moonMat = new THREE.MeshBasicMaterial({
    color: 0xfff0d6,
    fog: false,
    toneMapped: false,
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(5.2, 64, 40), moonMat);
  moon.position.set(-69, 43, -165);
  moon.rotation.y = -1.1;
  scene.add(moon);
  let disposed = false;
  const moonTexture = new THREE.TextureLoader().load(
    moonUrl,
    (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      moonMat.map = tex;
      moonMat.needsUpdate = true;
      invalidate();
    },
    undefined,
    () => {
      if (!disposed) {
        container.dataset.moonTexture = "unavailable";
        invalidate();
      }
    },
  );
  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = haloCanvas.height = 128;
  const ctx = haloCanvas.getContext("2d"),
    grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(188,210,223,.35)");
  grad.addColorStop(0.2, "rgba(132,175,213,.09)");
  grad.addColorStop(1, "rgba(100,150,210,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const haloTexture = new THREE.CanvasTexture(haloCanvas),
    halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haloTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
  halo.position.copy(moon.position);
  halo.scale.set(47, 47, 1);
  scene.add(halo);
  const positions = [],
    colors = [];
  let seed = 13;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 1100; i++) {
    const a = rand() * Math.PI * 2,
      y = 0.08 + rand() * 0.91,
      r = Math.sqrt(1 - y * y),
      d = 360;
    positions.push(Math.cos(a) * r * d, y * d, Math.sin(a) * r * d);
    const b = 0.25 + rand() * 0.5;
    colors.push(b * 0.8, b * 0.9, b);
  }
  const stars = new THREE.BufferGeometry();
  stars.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  stars.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  scene.add(
    new THREE.Points(
      stars,
      new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        fog: false,
        depthWrite: false,
      }),
    ),
  );
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.14, 0.45, 1.1);
  const output = new OutputPass();
  composer.addPass(bloom);
  composer.addPass(output);
  let visible = true,
    paused = reducedMotion,
    frame = 0,
    time = 0,
    prev = performance.now(),
    needsRender = true,
    step = 30,
    condition = 100;
  let weather = 0.45,
    targetWeather = 0.45,
    travel = 0;
  function invalidate() {
    needsRender = true;
    if (!frame && !disposed && !document.hidden && visible)
      frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (disposed || document.hidden || !visible) return;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (!paused) {
      time += dt;
      weather += (targetWeather - weather) * (1 - Math.exp(-dt * 1.5));
    }
    const response = sailingResponse(step, condition, weather);
    if (!paused) travel += dt * response.forwardSpeed;
    const moved = controls.update();
    if (!paused || needsRender || moved) {
      response.surface = seaHeight(0, 0, time, weather, travel);
      ship.update(time, paused ? 0 : dt, !paused, response);
      ocean.material.uniforms.uTime.value = time;
      ocean.material.uniforms.uBuilt.value = step;
      ocean.material.uniforms.uWeather.value = weather;
      ocean.material.uniforms.uTravel.value = travel;
      spray.update(time, weather, travel, step);
      skyMat.uniforms.uWeather.value = weather;
      scene.fog.density = 0.002 + weather * 0.004;
      moonLight.intensity = 3.3 - weather * 0.8;
      skyMat.uniforms.uTime.value = time;
      composer.render(dt);
      needsRender = false;
    }
    if ((!paused || moved) && !frame) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const w = container.clientWidth,
      h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w < 600 ? 40 * Math.max(1, 390 / w) : 35;
    camera.updateProjectionMatrix();
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) {
      prev = performance.now();
      invalidate();
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  intersection.observe(container);
  controls.addEventListener("change", invalidate);
  function visibility() {
    prev = performance.now();
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  }
  document.addEventListener("visibilitychange", visibility);
  function contextLost(e) {
    e.preventDefault();
    paused = true;
    onError("context-lost");
  }
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  resetCamera();
  resize();
  invalidate();
  return {
    setState(nextStep, nextCondition, { instant = false } = {}) {
      step = nextStep;
      condition = nextCondition;
      ship.setState(step, condition, { instant: instant || paused });
      if (step < 19) ship.clearEffects();
      invalidate();
    },
    setWeather(mode) {
      if (!Object.hasOwn(WEATHER, mode)) return;
      targetWeather = WEATHER[mode].severity;
      if (paused) weather = targetWeather;
      invalidate();
    },
    viewStern() {
      camera.position.set(-29, 8.5, 10);
      controls.target.set(-3, 5.2, 0);
      controls.update();
      invalidate();
    },
    setPaused(value) {
      paused = value;
      if (paused) {
        weather = targetWeather;
        ship.setState(step, condition, { instant: true });
        ship.clearEffects();
      }
      prev = performance.now();
      invalidate();
    },
    fire() {
      if (paused) return false;
      const ok = ship.fire();
      invalidate();
      return ok;
    },
    resetCamera,
    rotate(direction) {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * 0.28);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      invalidate();
    },
    getInfo() {
      return {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        paused,
      };
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      controls.dispose();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      const geos = new Set(),
        mats = new Set();
      scene.traverse((o) => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) mats.add(o.material);
      });
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      ship.dispose();
      ocean.dispose();
      spray.dispose();
      moonTexture.dispose();
      haloTexture.dispose();
      environment.dispose();
      bloom.dispose();
      output.dispose();
      composer.dispose();
      moonLight.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
