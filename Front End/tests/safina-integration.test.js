import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  validateShipProjection,
  acceptShipProjection,
} from "../src/features/safina/projection.js";
import {
  calendarState,
  monthStats,
  moveMonth,
  monthDays,
} from "../src/features/safina/calendar.js";
const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/ship-v05/${name}.json`, import.meta.url)),
  );

test("all supplied v0.5 projection fixtures pass and pending remains null, not zero health", () => {
  for (const file of readdirSync(
    new URL("./fixtures/ship-v05/", import.meta.url),
  )) {
    if (file === "legacy-studio-progress.json") continue;
    const value = fixture(file.replace(".json", ""));
    assert.equal(validateShipProjection(value), value);
  }
  assert.equal(validateShipProjection(fixture("awaiting-policy")).state, null);
});
test("ship projection rejects wrong assets, ranges, phases and unapproved inferred health", () => {
  const source = fixture("construction-12");
  for (const value of [
    { ...source, assetVersion: "0.4" },
    { ...source, revision: -1 },
    { ...source, state: { ...source.state, health: 91 } },
    { ...source, state: { ...source.state, buildStep: 30 } },
    {
      ...source,
      state: { ...source.state, maintenanceTimezone: "not-a-zone" },
    },
    {
      ...fixture("maintenance-100"),
      state: { ...fixture("maintenance-100").state, health: 101 },
    },
  ])
    assert.throws(() => validateShipProjection(value));
});
test("stale/equal revisions do not replay animation and unexpected vessels are rejected", () => {
  const current = { ...fixture("maintenance-94"), revision: 10 };
  assert.equal(
    acceptShipProjection(current, {
      ...fixture("maintenance-91"),
      revision: 9,
    }),
    current,
  );
  assert.equal(acceptShipProjection(current, { ...current }), current);
  const newer = { ...fixture("maintenance-100"), revision: 11 };
  assert.equal(acceptShipProjection(current, newer), newer);
  assert.throws(() =>
    acceptShipProjection(current, { ...newer, vesselId: "another-vessel" }),
  );
});
test("calendar completion colors are the same for every tier", () => {
  for (const tier of ["B", "BI", "BJ1", "BJ2", "BJ3", "BJ4", "BJ5"]) {
    assert.equal(
      calendarState(
        {
          date: "2026-09-29",
          status: "completed",
          historicalLevels: [{ tier }],
        },
        "2026-10-01",
      ),
      "complete",
    );
    assert.equal(
      calendarState(
        {
          date: "2026-09-29",
          status: "no_entry",
          historicalLevels: [{ tier }],
        },
        "2026-10-01",
      ),
      "missed",
    );
  }
});
test("future/open/rest/unassigned/unknown days cannot masquerade as misses", () => {
  const state = (status, date = "2026-10-01", extra = {}) =>
    calendarState({ status, date, ...extra }, "2026-10-01");
  assert.equal(state("no_entry"), "open");
  assert.equal(state("no_entry", "2026-10-02"), "future");
  assert.equal(state("free_day", "2026-09-30"), "rest");
  assert.equal(
    state("no_entry", "2026-09-30", { historicalLevels: [] }),
    "unassigned",
  );
  assert.equal(state("recorded_awaiting_policy", "2026-09-30"), "unknown");
  assert.equal(state(undefined, "2026-09-30"), "unknown");
});
test("month streak skips rest and an open current day, but not partial or unknown closed days", () => {
  const rows = [
    { date: "2026-09-28", status: "complete" },
    { date: "2026-09-29", status: "free_day" },
    { date: "2026-09-30", status: "complete" },
    { date: "2026-10-01", status: "partial" },
    { date: "2026-10-02", status: "complete" },
  ];
  assert.deepEqual(monthStats(rows, "2026-10-01"), { complete: 2, streak: 2 });
  assert.equal(monthStats(rows, "2026-10-02").streak, 1);
  rows[2].status = "awaiting_policy";
  assert.equal(monthStats(rows, "2026-10-01").streak, 0);
});
test("calendar navigation handles leap months and year rollover", () => {
  assert.equal(monthDays("2028-02"), 29);
  assert.equal(monthDays("2026-02"), 28);
  assert.equal(moveMonth("2026-01", -1), "2025-12");
  assert.equal(moveMonth("2026-12", 1), "2027-01");
});
