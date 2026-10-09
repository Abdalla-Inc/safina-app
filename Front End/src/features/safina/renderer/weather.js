// Art-direction presets only. No network, clock, ledger or account input.
export const WEATHER = {
  clear: { label: "Clear skies", severity: 0 },
  breeze: { label: "Fresh breeze", severity: 0.45 },
  rough: { label: "Rough seas", severity: 1 },
};
export function sailingResponse(built, condition, severity) {
  const strength =
    Math.max(0, Math.min(1, built / 30)) *
    Math.max(0, Math.min(1, condition / 100));
  const sea = Math.max(0, Math.min(1, severity));
  const vulnerability = Math.pow(1 - strength, 1.4);
  const movement = 0.35 + 3.2 * vulnerability;
  const damage = 1 - Math.max(0, Math.min(1, condition / 100));
  const storm = sea * sea;
  return {
    strength,
    roll: (0.009 + storm * 0.145) * movement,
    pitch: (0.005 + storm * 0.1) * movement,
    heave: (0.035 + storm * 0.54) * (0.35 + 2.0 * vulnerability),
    sink: Math.pow(damage, 1.6) * 2.35,
    plunge: storm * vulnerability * 1.65,
    surfaceFollow: 0.72 - vulnerability * 0.45,
    list: Math.pow(damage, 2) * 0.16,
    wind: 0.32 + sea * 3.7,
    forwardSpeed: built === 0 ? 0 : (0.35 + sea * 0.7) * (0.3 + strength * 0.7),
    label:
      built === 0
        ? "Waiting for the first timber"
        : damage > 0.7 && sea > 0.7
          ? "On the verge of sinking"
          : sea < 0.15
            ? "Gentle sailing"
            : strength >= 0.8
              ? "Steady course"
              : strength >= 0.45
                ? "Working through the swell"
                : "Struggling with the swell",
  };
}

// Deterministic pose lets pause freeze the exact phase and keeps flooding tunable.
export function vesselPose(time, response) {
  const dip = Math.pow(Math.max(0, Math.sin(time * 0.83 + 0.5)), 4);
  return {
    y:
      (response.surface || 0) * (response.surfaceFollow ?? 0.6) +
      (Math.sin(time * 1.1) + Math.sin(time * 1.79) * 0.28) * response.heave -
      (response.sink || 0) -
      dip * (response.plunge || 0),
    roll:
      (Math.sin(time * 0.92) + Math.sin(time * 1.57) * 0.28) * response.roll +
      (response.list || 0),
    pitch: Math.sin(time * 1.1 + 0.4) * response.pitch,
  };
}
