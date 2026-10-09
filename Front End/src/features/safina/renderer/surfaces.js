import * as THREE from "three";

// Original, deterministic textures. No downloads or licensed asset dependencies.
const clamp = (v) => Math.max(0, Math.min(255, v));
function textureSet(width, height, sample) {
  const images = [0, 1, 2].map(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx, pixels: ctx.createImageData(width, height) };
  });
  let seed = 419;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const [color, relief, rough] = sample(x / width, y / height, random());
      const index = (y * width + x) * 4;
      [color, [relief, relief, relief], [rough, rough, rough]].forEach(
        (rgb, k) => {
          images[k].pixels.data.set([...rgb.map(clamp), 255], index);
        },
      );
    }
  const maps = images.map(({ canvas, ctx, pixels }, i) => {
    ctx.putImageData(pixels, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    if (i === 0) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
  return {
    map: maps[0],
    bumpMap: maps[1],
    roughnessMap: maps[2],
    dispose: () => maps.forEach((t) => t.dispose()),
  };
}
export function createSurfaces() {
  const oak = textureSet(1024, 512, (u, v, r) => {
    const grain = Math.sin(
      v * 970 + Math.sin(u * 17) * 2.4 + Math.sin(u * 39) * 0.7,
    );
    const pores = Math.pow(Math.max(0, Math.sin(v * 2400 + u * 15)), 12);
    const growth = Math.sin(v * 120 + Math.sin(u * 9) * 1.7) * 0.5 + 0.5;
    const scratch = r > 0.987 ? -0.16 : 0;
    const shade =
      0.73 +
      grain * 0.085 +
      growth * 0.17 +
      (r - 0.5) * 0.09 -
      pores * 0.07 +
      scratch;
    return [
      [190 * shade, 159 * shade, 116 * shade],
      128 + grain * 30 - pores * 25,
      170 + growth * 50 + r * 20,
    ];
  });
  const canvas = textureSet(1024, 1024, (u, v, r) => {
    const panel = Math.floor(u * 14);
    const seam = Math.abs(((u * 14) % 1) - 0.5);
    const stitch = seam < 0.011 && (v * 180) % 1 < 0.62;
    const edge =
      Math.pow(Math.abs(u - 0.5) * 2, 12) * 0.1 + Math.pow(v, 5) * 0.13;
    const stain =
      (Math.sin(u * 31 + v * 18) + Math.sin(u * 74 - v * 27)) * 0.016;
    const thread = Math.sin(u * 3200) * Math.sin(v * 3100) * 0.017;
    const shade =
      0.96 -
      edge +
      stain +
      thread +
      (r - 0.5) * 0.025 -
      (panel % 3) * 0.012 -
      (seam < 0.025 ? 0.07 : 0);
    return [
      [232 * shade, 221 * shade, 196 * shade],
      128 + (stitch ? 48 : 0) + thread * 1600,
      230 + r * 20,
    ];
  });
  const metal = textureSet(256, 256, (u, v, r) => {
    const p = Math.sin(u * 33 + Math.sin(v * 23)) * Math.sin(v * 41);
    return [
      [220 + p * 20, 209 + p * 18, 181 + p * 15],
      110 + r * 35,
      130 + p * 45 + r * 40,
    ];
  });
  return {
    oak,
    canvas,
    metal,
    dispose() {
      oak.dispose();
      canvas.dispose();
      metal.dispose();
    },
  };
}
