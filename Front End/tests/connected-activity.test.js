import test from "node:test";
import assert from "node:assert/strict";
import { customDisplayRanges } from "../src/connected/activityFacts.js";
import { validateShipProjection } from "../src/features/safina/projection.js";
import { readFileSync } from "node:fs";
test("connected custom display unions repeats and removes assigned coverage without altering evidence", () => {
  const card = {
    completedComponents: [{ ranges: [{ start: "2:1", end: "2:286" }] }],
    facts: [
      { kind: "custom_reading", ranges: [{ start: "1:1", end: "2:141" }] },
      { kind: "custom_reading", ranges: [{ start: "1:1", end: "1:7" }] },
    ],
  };
  const saved = JSON.stringify(card);
  assert.deepEqual(customDisplayRanges(card), [{ start: "1:1", end: "1:7" }]);
  assert.equal(JSON.stringify(card), saved);
});
test("connected custom display keeps gaps and final Quran boundary", () => {
  assert.deepEqual(
    customDisplayRanges({
      facts: [
        {
          kind: "custom_reading",
          ranges: [
            { start: "114:1", end: "114:2" },
            { start: "114:4", end: "114:6" },
          ],
        },
      ],
    }),
    [
      { start: "114:1", end: "114:2" },
      { start: "114:4", end: "114:6" },
    ],
  );
});

test("server ship fixture is accepted by the connected renderer without invented state", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "../../Back End/contracts/connected-fixtures/october-ship-pending.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).fixture;
  assert.equal(validateShipProjection(fixture).state, null);
});
