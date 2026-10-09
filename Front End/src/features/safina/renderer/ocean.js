// Shared wave field: the visible mesh and vessel sample the same traveling swells.
const waves = [
  { x: 0.19, z: 0.27, speed: 1.1, phase: 0, weight: 1 },
  { x: -0.31, z: 0.17, speed: 1.43, phase: 1.8, weight: 0.48 },
  { x: 0.59, z: 0.37, speed: 1.92, phase: 3.2, weight: 0.24 },
];
export function seaHeight(x, z, time, severity, travel = 0) {
  const amplitude = 0.045 + severity * severity * 1.45;
  return waves.reduce((sum, w) => {
    const p = (x + travel * 0.35) * w.x + z * w.z - time * w.speed + w.phase;
    return sum + (Math.sin(p) + Math.sin(2 * p) * 0.19) * w.weight * amplitude;
  }, 0);
}
export const waveGLSL = `
float swell(vec2 p){
  p.x += uTravel * .35;
  float a = .045 + uWeather * uWeather * 1.45;
  float h = 0.;
  ${waves.map((w) => `{float q=dot(p,vec2(${w.x},${w.z}))-uTime*${w.speed.toFixed(2)}+${w.phase.toFixed(2)};h+=(sin(q)+sin(q*2.)*.19)*${w.weight.toFixed(2)}*a;}`).join("\n")}
  return h;
}`;
