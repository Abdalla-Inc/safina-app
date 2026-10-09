import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizeQuranSearch,
  matchingSurahs,
  readerWindow,
} from "../src/data/reader.js";
import { backendReadingStatus, loadJourney } from "../src/services/backend.js";
const surahs = JSON.parse(
  readFileSync(new URL("../public/data/quran.json", import.meta.url)),
);
test("surah search supports Arabic numbers, diacritics and hamza variants", () => {
  assert.equal(matchingSurahs(surahs, "١١٤")[0].id, 114);
  assert.equal(matchingSurahs(surahs, "آل عِمران")[0].id, 3);
  assert.equal(matchingSurahs(surahs, "الاخلاص")[0].id, 112);
  assert.equal(matchingSurahs(surahs, "not a surah").length, 0);
  assert.equal(normalizeQuranSearch("  أَحَد  "), "احد");
});
test("reader bounds never duplicate or skip verses across default windows", () => {
  for (const s of surahs) {
    let from = 1,
      ids = [];
    while (from <= s.total_verses) {
      const w = readerWindow(s.total_verses, from);
      ids.push(...s.verses.slice(w.from - 1, w.end).map((v) => v.id));
      from = w.end + 1;
    }
    assert.equal(ids.length, s.total_verses);
    assert.equal(new Set(ids).size, s.total_verses);
    assert.equal(ids[0], 1);
    assert.equal(ids.at(-1), s.total_verses);
  }
  assert.deepEqual(readerWindow(7, -4), { from: 1, end: 7 });
  assert.deepEqual(readerWindow(286, 9999), { from: 286, end: 286 });
  assert.deepEqual(readerWindow(286, 255, 40), { from: 255, end: 286 });
});
test("backend completed status is displayed as complete; unresolved and unknown remain distinct", () => {
  assert.equal(backendReadingStatus("completed"), "complete");
  assert.equal(
    backendReadingStatus("recorded_awaiting_policy"),
    "recorded_awaiting_policy",
  );
  assert.equal(backendReadingStatus("partial"), "partial");
  assert.equal(backendReadingStatus("unrecognized"), "unknown");
});
test("backend read adapter bounds calendar, retains null ship and surfaces errors", async () => {
  const original = global.fetch,
    seen = [];
  global.fetch = async (url, options) => {
    seen.push({ url, options });
    return {
      ok: true,
      json: async () =>
        url.includes("/health")
          ? { contractVersion: "0.3.0" }
          : url.includes("/calendar")
            ? { days: [] }
            : url.includes("/ship-progress")
              ? {
                  approvedCredits: 1,
                  currentShip: null,
                  presentationStatus: "awaiting_policy",
                }
              : { cycles: [] },
    };
  };
  try {
    const d = await loadJourney("2026-02");
    assert.equal(d.ship.currentShip, null);
    assert.equal(d.ship.approvedCredits, 1);
    assert.ok(seen.some((x) => x.url.includes("end=2026-02-28")));
    assert.ok(seen.every((x) => !x.options.headers.Authorization));
    global.fetch = async () => ({
      ok: false,
      json: async () => ({ error: { code: "BACKEND_UNAVAILABLE" } }),
    });
    await assert.rejects(loadJourney("2026-02"), /BACKEND_UNAVAILABLE/);
  } finally {
    global.fetch = original;
  }
});
