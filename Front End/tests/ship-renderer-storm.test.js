import test from "node:test";
import assert from "node:assert/strict";
import { seaHeight } from "../src/features/safina/renderer/ocean.js";
import { sailSurvives, hullBreach } from "../src/features/safina/renderer/damage.js";
import { sailingResponse, vesselPose } from "../src/features/safina/renderer/weather.js";

test("rough swells have visible height and move through the scene", () => {
  const rough = [],
    clear = [];
  for (let t = 0; t < 40; t += 0.1) {
    rough.push(seaHeight(0, 0, t, 1));
    clear.push(seaHeight(0, 0, t, 0));
  }
  assert.ok(Math.max(...rough) - Math.min(...rough) > 4);
  assert.ok(Math.max(...clear) - Math.min(...clear) < 0.2);
  assert.notEqual(seaHeight(0, 0, 3, 1), seaHeight(10, 0, 3, 1));
});
test("severe damage leaves one remnant; repair closes breaches and restores all sails", () => {
  const count = (c) =>
    Array.from({ length: 10 }, (_, i) => sailSurvives(i, c)).filter(Boolean)
      .length;
  assert.equal(count(15), 1);
  assert.equal(count(100), 10);
  assert.ok(hullBreach(15) > 0.9);
  assert.equal(hullBreach(100), 0);
  assert.ok(count(50) > count(15));
});
test("critical ship floods its standing deck then resurfaces; healthy ship keeps its deck clear", () => {
  let flooded = 0,
    resurfaced = 0,
    healthyFlooded = 0;
  const damaged = sailingResponse(30, 15, 1),
    healthy = sailingResponse(30, 100, 1);
  for (let t = 0; t < 60; t += 0.1) {
    const surface = seaHeight(0, 0, t, 1, t * 0.4);
    const bad = vesselPose(t, { ...damaged, surface });
    const good = vesselPose(t, { ...healthy, surface });
    if (bad.y + 2.77 < surface) flooded++;
    else resurfaced++;
    if (good.y + 2.77 < surface) healthyFlooded++;
  }
  assert.ok(flooded > 80, `Only ${flooded} submerged samples`);
  assert.ok(resurfaced > 80, "Vessel must recover between plunges");
  assert.equal(healthyFlooded, 0);
  assert.equal(healthy.sink, 0);
  assert.equal(healthy.plunge, 0);
});
