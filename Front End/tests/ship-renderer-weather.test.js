import test from "node:test";
import assert from "node:assert/strict";
import { WEATHER, sailingResponse } from "../src/features/safina/renderer/weather.js";

test("a healthy nearly complete ship handles the same rough sea more steadily", () => {
  const early = sailingResponse(8, 100, WEATHER.rough.severity);
  const strong = sailingResponse(28, 100, WEATHER.rough.severity);
  assert.ok(early.roll > strong.roll * 3);
  assert.ok(early.heave > strong.heave * 2);
  assert.ok(strong.forwardSpeed > early.forwardSpeed);
  assert.equal(strong.label, "Steady course");
});
test("sea severity grows while construction and condition remain independent", () => {
  const clear = sailingResponse(16, 80, WEATHER.clear.severity);
  const rough = sailingResponse(16, 80, WEATHER.rough.severity);
  assert.equal(clear.strength, rough.strength);
  assert.ok(rough.roll > clear.roll);
  assert.ok(rough.wind > clear.wind);
});
test("condition contributes to handling and an empty sea is not a struggling ship", () => {
  assert.ok(sailingResponse(30, 20, 1).roll > sailingResponse(30, 100, 1).roll);
  assert.equal(sailingResponse(0, 100, 1).forwardSpeed, 0);
  assert.equal(
    sailingResponse(0, 100, 1).label,
    "Waiting for the first timber",
  );
});
