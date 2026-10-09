import * as THREE from "three";
// A small original night environment supplies soft reflections to brass and wet timber.
export function nightEnvironment(renderer) {
  const width = 512,
    height = 256;
  const values = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const u = x / width,
        v = y / height;
      const horizon = Math.exp(-Math.pow((v - 0.5) / 0.13, 2));
      const moon = Math.exp(
        -Math.pow((u - 0.68) / 0.045, 2) - Math.pow((v - 0.3) / 0.06, 2),
      );
      const warm = Math.exp(
        -Math.pow((u - 0.2) / 0.12, 2) - Math.pow((v - 0.58) / 0.05, 2),
      );
      const i = (y * width + x) * 4;
      values[i] = 0.018 + horizon * 0.1 + moon * 2.1 + warm * 0.55;
      values[i + 1] = 0.032 + horizon * 0.16 + moon * 2.5 + warm * 0.25;
      values[i + 2] = 0.065 + horizon * 0.25 + moon * 3.2 + warm * 0.07;
      values[i + 3] = 1;
    }
  const source = new THREE.DataTexture(
    values,
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(source);
  source.dispose();
  pmrem.dispose();
  return target;
}
