import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { adaptShipProgress } from "../src/features/safina/renderer/progress.js";
const fixture = JSON.parse(
  await readFile(new URL("./fixtures/ship-v05/legacy-studio-progress.json", import.meta.url)),
);

test("accepts the actual wrapped backend fixture and preserves the 30th unit", () => {
  const result = adaptShipProgress(fixture, "2026-09");
  assert.equal(result.step, 30);
  assert.equal(result.presentationStatus, "awaiting_policy");
  assert.equal(result.damagePolicy, "not-connected");
});
test("accepts the live bare response shape without treating carry as approved", () => {
  const result = adaptShipProgress(fixture.fixture, "2026-09");
  assert.equal(result.step, 30);
  assert.equal(result.period, "2026-09");
});
test("does not use lifetime credits or infer inactivity wear from ledger gaps", () => {
  const response = {
    ...fixture.fixture,
    approvedCredits: 64,
    ledger: [],
    periods: [{ month: "2026-09", approvedCredits: 4 }],
  };
  const result = adaptShipProgress(response, "2026-09");
  assert.equal(result.step, 4);
  assert.equal(result.condition, 100);
});
test("a corrected 30-to-29 month removes exactly one construction unit", () => {
  const response = structuredClone(fixture.fixture);
  response.periods[0].approvedCredits = 29;
  response.unresolvedDayCredits = [{ date: "2026-09-01", credit: null }];
  assert.equal(adaptShipProgress(response, "2026-09").step, 29);
});
test("refuses absent months, unsupported policies and invalid credits", () => {
  assert.throws(() => adaptShipProgress(fixture, "2026-10"));
  assert.throws(() =>
    adaptShipProgress({ ...fixture.fixture, creditsPerShip: 20 }, "2026-09"),
  );
  for (const approvedCredits of [null, -1, 0.5, 31, "30", NaN]) {
    assert.throws(() =>
      adaptShipProgress(
        {
          ...fixture.fixture,
          periods: [{ month: "2026-09", approvedCredits }],
        },
        "2026-09",
      ),
    );
  }
});
