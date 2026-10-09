import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PARTS } from "./progress.js";
import { sailSurvives, hullBreach } from "./damage.js";
import { vesselPose } from "./weather.js";
import { createSurfaces } from "./surfaces.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const material = (color, options = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...options });
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d"),
    g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,226,157,.8)");
  g.addColorStop(0.16, "rgba(255,193,91,.25)");
  g.addColorStop(1, "rgba(255,164,43,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
export function createShip() {
  const root = new THREE.Group();
  root.name = "Safina — night guardian";
  const groups = PARTS.map((name, i) => {
    const g = new THREE.Group();
    g.name = `step_${String(i + 1).padStart(2, "0")}_${name}`;
    root.add(g);
    return g;
  });
  const surfaces = createSurfaces(),
    glowMap = glowTexture();
  const oakMaps = {
    map: surfaces.oak.map,
    bumpMap: surfaces.oak.bumpMap,
    roughnessMap: surfaces.oak.roughnessMap,
    bumpScale: 0.055,
  };
  const timber = material(0x665044, { ...oakMaps, roughness: 0.83 }),
    wood = material(0x9b7350, { ...oakMaps, roughness: 0.78 }),
    deck = material(0xbfa076, {
      ...oakMaps,
      bumpScale: 0.035,
      roughness: 0.92,
    }),
    ebony = material(0x303734, { ...oakMaps, roughness: 0.62 }),
    gold = material(0xc59a4d, {
      map: surfaces.metal.map,
      roughnessMap: surfaces.metal.roughnessMap,
      metalness: 0.84,
      roughness: 0.44,
    }),
    iron = material(0x454b4e, {
      roughnessMap: surfaces.metal.roughnessMap,
      bumpMap: surfaces.metal.bumpMap,
      bumpScale: 0.012,
      metalness: 0.85,
      roughness: 0.48,
    }),
    ropeMat = material(0x7d6a4c, { ...oakMaps, bumpScale: 0.03 }),
    black = material(0x04080a),
    cloth = new THREE.MeshPhysicalMaterial({
      color: 0xf5ead5,
      map: surfaces.canvas.map,
      bumpMap: surfaces.canvas.bumpMap,
      bumpScale: 0.004,
      roughness: 0.95,
      side: THREE.DoubleSide,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xd6c6a4),
      sheenRoughness: 0.86,
    });
  const windowGlass = material(0xf5b760, {
    emissive: 0xffad45,
    emissiveIntensity: 1.0,
  });
  const sails = [],
    lights = [],
    glows = [],
    cannons = [],
    damaged = [],
    hullUniforms = [],
    pennants = [],
    animations = new Map();
  function mesh(parent, geo, mat) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function accurateShadow(object) {
    const mat = object.material;
    const depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      side: THREE.DoubleSide,
    });
    depth.onBeforeCompile = (shader) => {
      const litShader = mat.userData.shader;
      mat.onBeforeCompile(shader);
      mat.userData.shader = litShader;
    };
    depth.customProgramCacheKey = mat.customProgramCacheKey;
    object.customDepthMaterial = depth;
  }
  function box(parent, x, y, z, sx, sy, sz, mat = wood) {
    const min = Math.min(sx, sy, sz);
    const geo =
      min > 0.07 && Math.max(sx, sy, sz) > 0.24
        ? new RoundedBoxGeometry(sx, sy, sz, 1, Math.min(0.035, min * 0.16))
        : new THREE.BoxGeometry(sx, sy, sz);
    const m = mesh(parent, geo, mat);
    m.position.set(x, y, z);
    return m;
  }
  function beam(parent, a, b, r, mat = timber, r2 = r) {
    const d = b.clone().sub(a);
    const m = mesh(
      parent,
      new THREE.CylinderGeometry(r2, r, d.length(), 10),
      mat,
    );
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    return m;
  }
  function rope(parent, pts, r = 0.016, mat = ropeMat) {
    return mesh(
      parent,
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts),
        Math.max(10, pts.length * 4),
        r,
        4,
        false,
      ),
      mat,
    );
  }
  function ring(parent, p, r, tube, mat = gold, axis = "y") {
    const m = mesh(parent, new THREE.TorusGeometry(r, tube, 5, 18), mat);
    m.position.copy(p);
    if (axis === "y") m.rotation.x = Math.PI / 2;
    if (axis === "x") m.rotation.y = Math.PI / 2;
    return m;
  }
  function width(t) {
    return (
      Math.pow(Math.sin(Math.PI * (0.085 + t * 0.915)), 0.62) * 2.08 + 0.05
    );
  }
  function top(t) {
    return (
      2.9 +
      Math.pow(Math.max(0, 0.34 - t), 2) * 8 +
      Math.pow(Math.max(0, t - 0.7), 2) * 6
    );
  }
  function hp(t, v, side) {
    return V(
      -0.1 + (-7 + 14 * t) * (0.83 + 0.17 * v),
      -0.9 + (top(t) + 0.9) * v,
      side * width(t) * Math.sin((v * Math.PI) / 2),
    );
  }
  // A deep keel and broad ribs support a substantial two-deck hull.
  const keel = [];
  for (let i = 0; i <= 24; i++) keel.push(hp(i / 24, 0, 0));
  rope(groups[0], keel, 0.12, timber);
  for (const t of [0, 1])
    beam(groups[0], hp(t, 0, 0), hp(t, 1, 0), 0.12, timber);
  for (let i = 1; i < 19; i++) {
    const t = i / 20,
      pts = [];
    for (let j = 0; j <= 20; j++) {
      const p = hp(t, Math.abs(j - 10) / 10, j < 10 ? -1 : 1);
      p.z *= 0.97;
      pts.push(p);
    }
    rope(groups[1 + Math.min(2, Math.floor((i - 1) / 6))], pts, 0.075, wood);
  }
  for (let i = 1; i < 15; i++)
    beam(groups[4], hp(i / 16, 0.94, -1), hp(i / 16, 0.94, 1), 0.07, wood);
  const ports = Array.from({ length: 8 }, (_, i) => 0.17 + i * 0.092);
  // Open geometry at gunports, with planking built in eight broad construction groups.
  for (let band = 0; band < 16; band++)
    for (const side of [-1, 1]) {
      const vertices = [],
        uv = [],
        indices = [],
        segments = 160;
      for (let i = 0; i < segments; i++) {
        const t = (i + 0.5) / segments;
        const cut =
          ports.some((p) => Math.abs(p - t) < 0.021) &&
          [7, 8, 11, 12].includes(band);
        if (cut) continue;
        const base = vertices.length / 3;
        for (const [u, v] of [
          [i / segments, (band + 0.018) / 16],
          [(i + 1) / segments, (band + 0.018) / 16],
          [i / segments, (band + 0.985) / 16],
          [(i + 1) / segments, (band + 0.985) / 16],
        ]) {
          const p = hp(u, v, side);
          vertices.push(p.x, p.y, p.z);
          uv.push(u * 4, v * 7);
        }
        indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const mat = (band > 10 ? ebony : band % 3 === 0 ? wood : timber).clone();
      mat.side = THREE.DoubleSide;
      const breach = { value: 0 };
      hullUniforms.push(breach);
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uBreach = breach;
        shader.vertexShader = "varying vec3 vTimber;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvTimber=position;",
        );
        shader.fragmentShader =
          "uniform float uBreach;varying vec3 vTimber;\n" +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>
          vec2 h=vTimber.xy; h.x += ${side === 1 ? "0.0" : "0.65"};
          float rag=.09*sin(h.y*39.+h.x*13.)+.06*sin(h.x*57.-h.y*19.);
          float a=length((h-vec2(-3.8,2.10))*vec2(.72,1.20));
          float b=length((h-vec2(.15,2.05))*vec2(.62,1.10));
          float c=length((h-vec2(3.6,2.25))*vec2(.84,1.14));
          float fracture=min(a,min(b,c))-(uBreach*1.25+rag*uBreach);
          if(uBreach>0. && fracture < 0.) discard;`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          if(uBreach>0. && fracture<.065) diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.32,.19,.09),.85);
          float joint=abs(fract(vTimber.x*.34+${(band * 0.37).toFixed(2)})-.5);
          diffuseColor.rgb *= .90+.10*smoothstep(.001,.009,joint);
          diffuseColor.rgb *= ${(0.9 + (band % 3) * 0.05).toFixed(2)};`,
        );
      };
      mat.customProgramCacheKey = () => `breached-hull-${side}-${band}`;
      const plank = mesh(groups[5 + Math.floor(band / 2)], geo, mat);
      accurateShadow(plank);
      damaged.push({
        mesh: plank,
        color: mat.color.clone(),
        side,
        loose: band === 14,
      });
    }
  // Close both hull ends. Each transom strake shares its side-planking build step.
  // The stern has non-zero width: side skins alone leave an open cross-section.
  for (const end of [0, 1]) {
    for (let band = 0; band < 16; band++) {
      const v0 = band / 16,
        v1 = (band + 1) / 16;
      const corners = [
        hp(end, v0, -1),
        hp(end, v0, 1),
        hp(end, v1, 1),
        hp(end, v1, -1),
      ];
      const inset = end === 0 ? 0.12 : -0.12;
      const points = [
        ...corners,
        ...corners.map((p) => p.clone().add(V(inset, 0, 0))),
      ];
      const indices = [
        0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2,
        2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
      ];
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          points.flatMap((p) => p.toArray()),
          3,
        ),
      );
      geo.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(
          [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
          2,
        ),
      );
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const capMaterial = (
        band > 10 ? ebony : band % 3 === 0 ? wood : timber
      ).clone();
      capMaterial.side = THREE.DoubleSide;
      const cap = mesh(groups[5 + Math.floor(band / 2)], geo, capMaterial);
      cap.name = end === 0 ? `stern_transom_${band}` : `bow_closure_${band}`;
      damaged.push({
        mesh: cap,
        color: capMaterial.color.clone(),
        side: 0,
        loose: false,
      });
    }
  }
  // Continue the hull's gilded bands across the transom; its timber stays closed during wear.
  for (const v of [0.25, 0.415, 0.59, 0.68, 0.84, 0.965, 1]) {
    const a = hp(0, v, -1),
      b = hp(0, v, 1);
    a.x -= 0.025;
    b.x -= 0.025;
    beam(groups[12], a, b, v === 1 ? 0.055 : 0.026, v === 0.25 ? wood : gold);
  }
  // A solid sternpost and rudder finish the rear silhouette at hull completion.
  beam(groups[12], V(-6.9, -0.7, 0), V(-7.22, 2.25, 0), 0.1, timber);
  const rudder = box(groups[12], -7.05, 0.34, 0, 0.62, 1.95, 0.16, wood);
  rudder.rotation.z = -0.13;
  for (const y of [-0.2, 0.5, 1.2])
    box(groups[12], -7.1, y, 0, 0.56, 0.065, 0.19, iron);
  // Gold wales follow the hull's compound curves.
  for (const side of [-1, 1])
    for (const v of [0.25, 0.415, 0.59, 0.68, 0.84, 0.965, 1]) {
      const pts = [];
      for (let i = 0; i <= 70; i++) {
        const p = hp(i / 70, v, side);
        p.z += side * 0.025;
        pts.push(p);
      }
      rope(groups[12], pts, v === 1 ? 0.066 : 0.028, v === 0.25 ? wood : gold);
    }
  for (let i = 0; i < 52; i++) {
    const t = (i + 0.5) / 52,
      x = -7.1 + t * 14;
    box(
      groups[13 + Math.min(2, Math.floor(i / 18))],
      x,
      2.77,
      0,
      0.258,
      0.1,
      width(t) * 1.88,
      deck,
    );
  }
  // A tall stepped stern with two illuminated galleries, not a single cabin box.
  for (let level = 0; level < 2; level++) {
    const x = -5.55 - level * 0.15,
      y = 3.35 + level * 0.94,
      w = 3.05 - level * 0.18;
    box(groups[16 + level], x, y, 0, 2.65, 0.92, w, ebony);
    // Bring the lower gallery facade aft of the transom's rising planks.
    // Its windows must sit on the outside of the newly enclosed hull.
    const rearFace = level === 0 ? -7.18 : x - 1.325;
    if (level === 0) box(groups[16], -7.02, y, 0, 0.32, 0.92, w, ebony);
    box(groups[16 + level], x, y + 0.48, 0, 2.93, 0.14, w + 0.2, wood);
    for (const side of [-1, 1]) {
      box(
        groups[16 + level],
        x,
        y - 0.37,
        side * (w / 2 + 0.025),
        2.75,
        0.065,
        0.045,
        gold,
      );
      box(
        groups[16 + level],
        x,
        y + 0.37,
        side * (w / 2 + 0.025),
        2.75,
        0.065,
        0.045,
        gold,
      );
      for (let j = 0; j < 6; j++) {
        const wx = x - 1.06 + j * 0.42;
        box(
          groups[16 + level],
          wx,
          y + 0.03,
          side * (w / 2 + 0.02),
          0.34,
          0.59,
          0.04,
          gold,
        );
        box(
          groups[16 + level],
          wx,
          y + 0.03,
          side * (w / 2 + 0.05),
          0.26,
          0.48,
          0.025,
          windowGlass,
        );
        box(
          groups[16 + level],
          wx,
          y + 0.03,
          side * (w / 2 + 0.07),
          0.024,
          0.5,
          0.015,
          ebony,
        );
        box(
          groups[16 + level],
          wx,
          y + 0.03,
          side * (w / 2 + 0.07),
          0.27,
          0.025,
          0.015,
          ebony,
        );
      }
    }
    for (let j = 0; j < 7; j++) {
      const z = -w * 0.42 + j * w * 0.14;
      box(groups[16 + level], rearFace - 0.02, y, z, 0.04, 0.58, 0.3, gold);
      box(
        groups[16 + level],
        rearFace - 0.05,
        y,
        z,
        0.02,
        0.46,
        0.22,
        windowGlass,
      );
      box(groups[16 + level], rearFace - 0.07, y, z, 0.02, 0.02, 0.23, ebony);
    }
    for (const dy of [-0.4, 0.4])
      box(
        groups[16 + level],
        rearFace - 0.03,
        y + dy,
        0,
        0.07,
        0.065,
        w + 0.06,
        gold,
      );
  }
  // Quarterdeck, stairway, stern balcony and ship's wheel.
  box(groups[17], -5.6, 4.8, 0, 3.1, 0.12, 3.12, deck);
  for (let i = 0; i < 8; i++)
    box(
      groups[16],
      -4.15 + i * 0.15,
      3.2 - i * 0.055,
      0,
      0.17,
      0.085,
      0.85,
      deck,
    );
  ring(groups[17], V(-4.15, 3.64, 0), 0.32, 0.045, wood, "x");
  beam(groups[17], V(-4.15, 2.8, 0), V(-4.15, 3.65, 0), 0.06, gold);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    beam(
      groups[17],
      V(-4.15, 3.64, 0),
      V(-4.15, 3.64 + Math.cos(a) * 0.41, Math.sin(a) * 0.41),
      0.022,
      wood,
    );
  }
  // Two broadside batteries: the barrels and muzzle interiors have depth.
  function cannon(t, v, side, index) {
    const base = hp(t, v, side),
      parent = groups[index],
      frameW = 0.61,
      frameH = 0.47;
    for (const dy of [-frameH / 2, frameH / 2])
      box(parent, base.x, base.y + dy, base.z, frameW, 0.065, 0.1, gold);
    for (const dx of [-frameW / 2, frameW / 2])
      box(parent, base.x + dx, base.y, base.z, 0.065, frameH, 0.1, wood);
    box(parent, base.x, base.y, base.z - side * 0.15, 0.56, 0.42, 0.04, black);
    const lid = box(
      parent,
      base.x,
      base.y + 0.42,
      base.z + side * 0.16,
      0.59,
      0.06,
      0.48,
      ebony,
    );
    lid.rotation.x = side * 0.65;
    const gun = new THREE.Group();
    gun.position.copy(base);
    parent.add(gun);
    beam(
      gun,
      V(0, -0.02, -side * 0.45),
      V(0, 0, side * 0.64),
      0.14,
      iron,
      0.102,
    );
    const muzzle = mesh(
      gun,
      new THREE.CylinderGeometry(0.075, 0.075, 0.018, 16),
      black,
    );
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.z = side * 0.654;
    ring(gun, V(0, 0, side * 0.64), 0.101, 0.018, iron, "z");
    ring(gun, V(0, 0, side * 0.31), 0.126, 0.018, iron, "z");
    cannons.push({ group: gun, base: base.clone(), side, delay: 0, age: 99 });
  }
  for (const side of [-1, 1])
    for (const t of ports) {
      cannon(t, 0.5, side, 18);
      cannon(t, 0.75, side, 19);
    }
  // Every mast has its own tops, spars, shrouds, ratlines and sail tiers.
  const mastSpecs = [
    { x: -3.9, height: 11.4, width: 3.8, base: 4.8, index: 20 },
    { x: 0, height: 15, width: 6.5, base: 3.35, index: 21 },
    { x: 4.0, height: 13.15, width: 5.45, base: 3.2, index: 22 },
  ];
  function sailMaterial(phase) {
    const mat = cloth.clone();
    const wearUniform = { value: 0 },
      windUniform = { value: 1 };
    const timeUniform = { value: 0 };
    mat.userData.timeUniform = timeUniform;
    mat.userData.wearUniform = wearUniform;
    mat.userData.windUniform = windUniform;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform;
      shader.uniforms.uWear = wearUniform;
      shader.uniforms.uWind = windUniform;
      shader.vertexShader =
        "uniform float uTime; uniform float uWind; varying vec2 vCloth;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\nvCloth=uv; float edge=sin(uv.x*3.14159); transformed.x+=edge*uv.y*uWind*(sin(uTime*1.3+uv.x*7.+${phase.toFixed(1)})*.19+sin(uv.x*85.+uTime*6.)*.04);`,
      );
      shader.fragmentShader =
        "uniform float uWear; varying vec2 vCloth;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>\nfloat edge=sin(vCloth.x*103.)*.06+sin(vCloth.x*57.)*.07; float remain=1.-pow(uWear,1.3)*.86; if(vCloth.y>remain+uWear*edge)discard;float hole=length((vCloth-vec2(.28,.32))*vec2(1.,1.5));if(hole<uWear*.23)discard;float slit=abs(vCloth.x-.72-sin(vCloth.y*38.)*.02);if(slit<uWear*.06&&vCloth.y>.08&&vCloth.y<.82)discard;`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>\nfloat seam=1.-smoothstep(.0,.019,abs(fract(vCloth.x*14.)-.5));float fold=sin(vCloth.x*67.+vCloth.y*4.+sin(vCloth.x*17.)*.6)*.032;float fiber=sin(vCloth.x*940.)*sin(vCloth.y*1000.)*.02;diffuseColor.rgb*=1.-seam*.21+fold+fiber;diffuseColor.rgb*=1.-uWear*.35;`,
      );
      mat.userData.shader = shader;
    };
    mat.customProgramCacheKey = () => `square-cloth-${phase}`;
    return mat;
  }
  function squareSail(parent, x, y, w, h, yaw, phase) {
    const frame = new THREE.Group();
    frame.position.set(x, y, 0);
    frame.rotation.y = yaw;
    parent.add(frame);
    beam(frame, V(0, 0, -w * 0.54), V(0, 0, w * 0.54), 0.052, wood, 0.042);
    const nx = 64,
      ny = 36,
      vertices = [],
      uv = [],
      indices = [];
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        const u = i / nx,
          v = j / ny;
        const z = (u - 0.5) * w * (1 - 0.1 * v);
        const y = -h * v + 0.28 * Math.sin(u * Math.PI) * Math.pow(v, 3);
        const envelope = Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 0.94);
        const folds =
          Math.sin(u * Math.PI * 22 + v * 2.5) * 0.052 * Math.sin(v * Math.PI);
        const bulge = (0.35 + w * 0.16) * envelope + folds;
        vertices.push(bulge, y, z);
        uv.push(u, v);
      }
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i;
        indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mat = sailMaterial(phase);
    const sail = mesh(frame, geo, mat);
    sails.push(sail);
    accurateShadow(sail);
    for (const z of [-1, 1])
      rope(
        frame,
        [
          V(0, 0, z * w * 0.5),
          V(0.15, -h * 0.5, z * w * 0.49),
          V(0, -h, z * w * 0.45),
        ],
        0.017,
        ropeMat,
      );
    const bottom = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      bottom.push(
        V(
          (0.35 + w * 0.16) * Math.sin(u * Math.PI) * Math.sin(Math.PI * 0.94),
          -h + 0.28 * Math.sin(u * Math.PI),
          (u - 0.5) * w * 0.9,
        ),
      );
    }
    rope(frame, bottom, 0.019, ropeMat);
  }
  mastSpecs.forEach((m, mi) => {
    beam(
      groups[m.index],
      V(m.x, 2.7, 0),
      V(m.x - 0.18, m.height, 0),
      0.15,
      wood,
      0.04,
    );
    for (const y of [m.height * 0.59, m.height * 0.8]) {
      const platform = mesh(
        groups[m.index],
        new THREE.CylinderGeometry(0.52, 0.3, 0.13, 16),
        wood,
      );
      platform.position.set(m.x, y, 0);
      ring(groups[m.index], V(m.x, y + 0.3, 0), 0.52, 0.025, gold);
      for (let j = 0; j < 10; j++) {
        const a = (j * Math.PI) / 5;
        beam(
          groups[m.index],
          V(m.x + Math.cos(a) * 0.49, y, Math.sin(a) * 0.49),
          V(m.x + Math.cos(a) * 0.49, y + 0.3, Math.sin(a) * 0.49),
          0.018,
          wood,
        );
      }
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++)
        rope(
          groups[m.index],
          [
            V(m.x - 0.08, m.height * 0.79, 0),
            V(m.x - 0.7 + i * 0.46, 2.95, side * 1.9),
          ],
          0.022,
        );
      for (let j = 0; j < 25; j++) {
        const t = j / 25;
        const y = 3.0 + (m.height * 0.79 - 3) * t,
          z = side * 1.9 * (1 - t);
        beam(
          groups[m.index],
          V(m.x - 0.7 * (1 - t), y, z),
          V(m.x + 0.68 * (1 - t), y, z),
          0.012,
          ropeMat,
        );
      }
    }
    rope(
      groups[m.index],
      [V(m.x, m.height - 0.3, 0), V(Math.min(7, m.x + 5), 3.15, 0)],
      0.018,
    );
    const sailIndex = 23 + mi;
    const tiers =
      mi === 0
        ? [
            [10.65, 3.2, 1.8],
            [8.5, 4, 2.7],
          ]
        : mi === 1
          ? [
              [14.1, 3.2, 1.8],
              [11.85, 4.6, 2.55],
              [8.8, 6.5, 3.7],
            ]
          : [
              [12.4, 2.9, 1.75],
              [10.2, 4.1, 2.25],
              [7.4, 5.4, 3.25],
            ];
    for (const [y, w, h] of tiers)
      squareSail(groups[sailIndex], m.x, y, w, h, -0.76, mi + y);
  });
  // A long rising bowsprit with staysails completes the strong forward silhouette.
  beam(groups[26], V(5.5, 2.6, 0), V(10.3, 6.0, 0), 0.12, wood, 0.035);
  for (let i = 0; i < 9; i++) {
    const p = V(5.5, 2.6, 0).lerp(V(10.3, 6, 0), i / 10);
    const band = ring(groups[26], p, 0.118 - i * 0.008, 0.024, ropeMat);
    band.quaternion.setFromUnitVectors(V(0, 0, 1), V(4.8, 3.4, 0).normalize());
  }
  rope(groups[26], [V(4, 12.8, 0), V(10.3, 6, 0), V(7, 1.1, 0)], 0.023);
  function jib(a, b, c) {
    const verts = [],
      uv = [],
      indices = [],
      n = 24;
    for (let j = 0; j <= n; j++)
      for (let i = 0; i <= n; i++) {
        const u = i / n,
          v = j / n,
          p = a.clone().lerp(b, u).lerp(c, v);
        p.z += Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.6;
        verts.push(p.x, p.y, p.z);
        uv.push(u, v);
      }
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const k = j * (n + 1) + i;
        indices.push(k, k + 1, k + n + 1, k + 1, k + n + 2, k + n + 1);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const sail = mesh(groups[26], geo, sailMaterial(30 + sails.length));
    sails.push(sail);
    accurateShadow(sail);
  }
  jib(V(4.2, 11.0, 0), V(9.9, 6.0, 0), V(5.5, 5.3, 0));
  jib(V(5.3, 7.8, 0), V(9.7, 5.5, 0), V(6.4, 3.5, 0));
  // Deck rails, gilded stem curls and stern ornamentation.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 46; i++) {
      const t = 0.03 + i * 0.0203,
        p = hp(t, 1, side);
      beam(groups[27], p, p.clone().add(V(0, 0.48, 0)), 0.026, gold);
    }
    for (const dy of [0.15, 0.49]) {
      const pts = [];
      for (let i = 2; i <= 97; i++) {
        const p = hp(i / 100, 1, side);
        p.y += dy;
        pts.push(p);
      }
      rope(groups[27], pts, 0.03, gold);
    }
    for (const y of [3.05, 3.78, 4.8])
      for (let j = 0; j < 7; j++) {
        const z = -1.42 + j * 0.47;
        beam(groups[27], V(-7, y, z), V(-7, y + 0.35, z), 0.022, gold);
      }
    for (const x of [-6.4, -5.0, 5.2, 6.1]) {
      const t = (x + 7.1) / 14,
        z = side * (width(t) + 0.04),
        y = top(t) - 0.32;
      const pts = [];
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 3,
          r = 0.02 + (i / 32) * 0.23;
        pts.push(V(x + Math.cos(a) * r, y + Math.sin(a) * r, z));
      }
      rope(groups[29], pts, 0.025, gold);
    }
    rope(
      groups[29],
      [
        V(5.4, 2.65, side * 0.9),
        V(6.6, 3.0, side * 0.65),
        V(7.45, 4.0, side * 0.22),
        V(8.2, 4.8, 0),
      ],
      0.07,
      gold,
    );
  }
  // Stern crest: concentric bronze ornament, with radiating spokes.
  ring(groups[29], V(-7.11, 4.55, 0), 0.32, 0.045, gold, "x");
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    beam(
      groups[29],
      V(-7.12, 4.55 + Math.cos(a) * 0.35, Math.sin(a) * 0.35),
      V(-7.12, 4.55 + Math.cos(a) * 0.5, Math.sin(a) * 0.5),
      0.025,
      gold,
    );
  }
  for (const m of mastSpecs) {
    const geometry = new THREE.PlaneGeometry(1.65, 0.58, 24, 6);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) + 0.825) / 1.65;
      const edge = Math.abs(p.getY(i)) / 0.29;
      p.setX(i, -u * 1.65 + Math.pow(u, 8) * (0.28 * (1 - edge)));
      p.setY(i, p.getY(i) + m.height + 0.48);
    }
    geometry.computeVertexNormals();
    const mat = material(0x183c48, { side: THREE.DoubleSide, roughness: 0.88 });
    const clock = { value: 0 },
      wind = { value: 1 };
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFlagTime = clock;
      shader.uniforms.uFlagWind = wind;
      shader.vertexShader =
        "uniform float uFlagTime;uniform float uFlagWind;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float travel=abs(position.x)/1.65;
        transformed.z+=sin(travel*9.-uFlagTime*3.)*travel*(.10+uFlagWind*.055);
        transformed.y+=sin(travel*7.-uFlagTime*2.)*travel*.06;`,
      );
    };
    mat.customProgramCacheKey = () => "safina-pennant";
    const flag = mesh(groups[29], geometry, mat);
    flag.position.x = m.x - 0.18;
    pennants.push({ mesh: flag, clock, wind });
    accurateShadow(flag);
    beam(
      groups[29],
      V(m.x - 0.18, m.height - 0.1, 0),
      V(m.x - 0.18, m.height + 1, 0),
      0.025,
      gold,
    );
  }
  const lanternMat = material(0xffdda0, {
    emissive: 0xffb33f,
    emissiveIntensity: 1.7,
  });
  for (const [x, y, z] of [
    [-6.6, 5.5, -1.42],
    [-6.6, 5.5, 1.42],
    [-5, 4.3, 1.65],
    [-5, 4.3, -1.65],
    [0, 3.7, -1.95],
    [0, 3.7, 1.95],
    [5.6, 3.9, -1.14],
    [5.6, 3.9, 1.14],
  ]) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    groups[28].add(g);
    beam(g, V(0, -0.6, 0), V(0, 0.31, 0), 0.029, gold);
    const bulb = mesh(
      g,
      new THREE.CylinderGeometry(0.1, 0.12, 0.29, 8),
      lanternMat,
    );
    bulb.position.y = 0.04;
    for (const y of [-0.13, 0.2]) {
      const cap = mesh(
        g,
        new THREE.CylinderGeometry(0.15, 0.16, 0.065, 8),
        gold,
      );
      cap.position.y = y;
    }
    const top = mesh(g, new THREE.ConeGeometry(0.17, 0.16, 8), gold);
    top.position.y = 0.29;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      beam(
        g,
        V(Math.cos(a) * 0.12, -0.13, Math.sin(a) * 0.12),
        V(Math.cos(a) * 0.12, 0.23, Math.sin(a) * 0.12),
        0.014,
        gold,
      );
    }
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.scale.set(1.4, 1.4, 1);
    g.add(glow);
    glows.push(glow);
    // Only four dynamic lights; other lamps use emissive glass and glow sprites.
    if (lights.length < 4) {
      const light = new THREE.PointLight(0xffb44c, 10, 6, 2);
      light.position.set(x, y, z);
      groups[28].add(light);
      lights.push(light);
    }
  }
  // Small deck fittings establish scale.
  for (const x of [-2, 2]) {
    box(groups[15], x, 2.9, 0, 1.0, 0.16, 0.85, wood);
    for (let i = 0; i < 8; i++)
      box(groups[15], x - 0.42 + i * 0.12, 3.0, 0, 0.035, 0.05, 0.78, iron);
  }
  for (const x of [-3, 1.1])
    for (const z of [-1.1, 1.1]) {
      const barrel = mesh(
        groups[15],
        new THREE.CylinderGeometry(0.23, 0.23, 0.55, 12),
        wood,
      );
      barrel.position.set(x, 3.1, z);
      for (const y of [2.92, 3.28])
        ring(groups[15], V(x, y, z), 0.235, 0.023, iron);
    }
  // Merge only static direct children; sail frames, gun recoil and lights stay independent.
  groups.forEach((g) => {
    const batches = new Map();
    for (const child of [...g.children]) {
      if (
        !child.isMesh ||
        damaged.some((d) => d.mesh === child) ||
        sails.includes(child) ||
        pennants.some((p) => p.mesh === child)
      )
        continue;
      child.updateMatrix();
      const key = child.material.uuid;
      if (!batches.has(key))
        batches.set(key, { mat: child.material, items: [] });
      batches.get(key).items.push(child);
    }
    for (const { mat, items } of batches.values())
      if (items.length > 1) {
        const geometries = items.map((o) => {
          const geometry = o.geometry.index
            ? o.geometry.toNonIndexed()
            : o.geometry.clone();
          return geometry.applyMatrix4(o.matrix);
        });
        const merged = mergeGeometries(geometries);
        if (merged) {
          items.forEach((o) => {
            g.remove(o);
            o.geometry.dispose();
          });
          mesh(g, merged, mat);
        }
        geometries.forEach((o) => o.dispose());
      }
  });
  // Reusable smoke and flash particles for an optional, fictional broadside preview.
  const smokeMap = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d"),
      g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, "rgba(200,208,215,.6)");
    g.addColorStop(0.4, "rgba(170,185,198,.35)");
    g.addColorStop(1, "rgba(130,150,170,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const effects = new THREE.Group();
  root.add(effects);
  const puffs = [];
  for (let i = 0; i < 12; i++) {
    const puff = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: smokeMap,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
    puff.visible = false;
    effects.add(puff);
    puffs.push({ sprite: puff, age: 99, origin: V(0, 0, 0), delay: 0 });
  }
  const flash = new THREE.PointLight(0xffbb59, 0, 14, 2);
  effects.add(flash);
  let built = 30,
    condition = 100,
    shotAge = 99;
  function setState(step, nextCondition, { instant = false } = {}) {
    const previous = built;
    built = step;
    condition = nextCondition;
    groups.forEach((g, i) => {
      const show = i < step;
      if (show && i >= previous && !instant) {
        animations.set(i, 0);
        g.position.y = 1.3;
        g.scale.setScalar(0.88);
      } else if (instant || !show) {
        animations.delete(i);
        g.position.y = 0;
        g.scale.setScalar(1);
      }
      g.visible = show;
    });
    const wear = 1 - condition / 100;
    hullUniforms.forEach((u) => {
      u.value = hullBreach(condition);
    });
    sails.forEach((sail, i) => {
      sail.visible = sailSurvives(i, condition);
      sail.material.userData.wearUniform.value = wear;
    });
    for (const p of damaged) {
      p.mesh.material.color
        .copy(p.color)
        .lerp(new THREE.Color(0x4a4b46), wear * 0.48);
      p.mesh.rotation.x = p.loose
        ? Math.max(0, wear - 0.45) * p.side * 0.065
        : 0;
    }
  }
  function fire() {
    if (built < 19 || shotAge < 4) return false;
    shotAge = 0;
    const guns = cannons.filter((c) => c.side === 1 && c.group.parent.visible);
    guns.forEach((c, i) => {
      c.age = -i * 0.075;
    });
    puffs.forEach((p, i) => {
      const c = guns[i % guns.length];
      p.origin.copy(c.base).add(V(0, 0, 0.8));
      p.age = -i * 0.1;
      p.sprite.visible = true;
    });
    return true;
  }
  function update(
    time,
    dt,
    motion = true,
    response = { heave: 0.1, roll: 0.013, pitch: 0.008, wind: 1 },
  ) {
    // Hold the sampled pose when paused; condition still changes the resting draft.
    const pose = vesselPose(time, response);
    root.position.y = pose.y;
    root.rotation.x = pose.roll;
    root.rotation.z = pose.pitch;
    const wear = 1 - condition / 100;
    pennants.forEach((p) => {
      p.clock.value = time;
      p.wind.value = response.wind;
    });
    for (const sail of sails) {
      sail.material.userData.windUniform.value = response.wind;
      sail.material.userData.timeUniform.value = time;
      const shader = sail.material.userData.shader;
      if (shader) {
        shader.uniforms.uTime.value = time;
        shader.uniforms.uWear.value = wear;
        shader.uniforms.uWind.value = response.wind;
      }
    }
    for (const g of glows) g.material.opacity = 1 - wear * 0.75;
    lights.forEach(
      (l, i) =>
        (l.intensity =
          (10 - wear * 8) * (motion ? 1 + Math.sin(time * 2.2 + i) * 0.04 : 1)),
    );
    for (const [i, elapsed] of animations) {
      const e = Math.min(1, (elapsed + dt) / 1),
        ease = 1 - Math.pow(1 - e, 3);
      groups[i].position.y = 1.3 * (1 - ease);
      groups[i].scale.setScalar(0.88 + 0.12 * ease);
      if (e === 1) animations.delete(i);
      else animations.set(i, elapsed + dt);
    }
    shotAge += dt;
    flash.intensity = shotAge < 1.1 ? Math.max(0, 1 - shotAge / 1.1) * 45 : 0;
    flash.position.set(0, 1.8, 2.6);
    for (const c of cannons) {
      c.age += dt;
      const recoil =
        c.age >= 0 && c.age < 0.7
          ? Math.sin((c.age / 0.7) * Math.PI) * 0.23
          : 0;
      c.group.position.copy(c.base);
      c.group.position.z -= recoil * c.side;
    }
    for (const p of puffs) {
      p.age += dt;
      const a = p.age;
      p.sprite.visible = a >= 0 && a < 4 && built >= 19;
      if (p.sprite.visible) {
        p.sprite.position.copy(p.origin).add(V(-a * 0.65, a * 0.55, a * 0.8));
        p.sprite.scale.setScalar(0.55 + a * 1.4);
        p.sprite.material.opacity = Math.max(0, (1 - a / 4) * 0.65);
      }
    }
  }
  setState(built, condition, { instant: true });
  return {
    root,
    groups,
    setState,
    update,
    fire,
    clearEffects() {
      shotAge = 99;
      flash.intensity = 0;
      puffs.forEach((p) => {
        p.age = 99;
        p.sprite.visible = false;
      });
      cannons.forEach((c) => {
        c.age = 99;
        c.group.position.copy(c.base);
      });
    },
    dispose() {
      const geos = new Set(),
        mats = new Set();
      root.traverse((o) => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) mats.add(o.material);
        if (o.customDepthMaterial) mats.add(o.customDepthMaterial);
      });
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      surfaces.dispose();
      glowMap.dispose();
      smokeMap.dispose();
    },
  };
}
