import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import {
  initialState,
  DEMO_DATE,
  uniqueCount,
  demoEvaluation,
  upsertEntry,
  retractEntry,
  undoReadingMutation,
  validateRange,
  searchMedia,
} from "../src/data/model.js";
import { juzStarts } from "../src/data/reference.js";
const quran = JSON.parse(
  fs.readFileSync(new URL("../public/data/quran.json", import.meta.url)),
);
const act = (overrides = {}) => ({
  surah: 2,
  from: 1,
  to: 20,
  date: DEMO_DATE,
  source: "manual_physical",
  repeat: false,
  ...overrides,
});
test("pinned Quran text remains byte-for-byte unchanged and structurally complete", () => {
  const bytes = fs.readFileSync(
    new URL("../public/data/quran.json", import.meta.url),
  );
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    "d8a8adff387f60ce3ff7dbe3238dd9b27120bfe29d8fcb07ad2e89cad37cefd4",
  );
  assert.equal(quran.length, 114);
  assert.equal(
    quran.reduce((n, s) => n + s.verses.length, 0),
    6236,
  );
  quran.forEach((s, i) => {
    assert.equal(s.id, i + 1);
    assert.equal(s.verses.length, s.total_verses);
    s.verses.forEach((v, n) => {
      assert.equal(v.id, n + 1);
      assert.ok(v.text.length);
    });
  });
});
test("range validation rejects reversed, missing, fractional and out-of-surah endpoints", () => {
  assert.equal(validateRange(2, 1, 286, quran), true);
  for (const r of [
    [2, 0, 20],
    [2, 3, 2],
    [2, 1, 287],
    [115, 1, 1],
    [2, 1.1, 20],
  ])
    assert.equal(validateRange(...r, quran), false);
});
test("manual and reader overlap form a union, not extra progress", () => {
  let s = upsertEntry(initialState(), act());
  s = upsertEntry(s, act({ from: 10, to: 30, source: "reader_confirmed" }));
  assert.equal(uniqueCount(s.entries, 2), 30);
  assert.equal(s.posts.length, 0);
});
test("an explicit repeat stays a separate act without multiplying unique coverage", () => {
  let s = upsertEntry(initialState(), act());
  s = upsertEntry(s, act({ repeat: true }));
  assert.equal(s.entries.length, 2);
  assert.equal(uniqueCount(s.entries, 2), 20);
  s = retractEntry(s, s.entries[0].id);
  assert.equal(uniqueCount(s.entries, 2), 20);
});
test("unconfirmed reader observation adds no reading or demo credit", () => {
  const s = { ...initialState(), trace: { surah: 2, from: 1, to: 286 } };
  assert.equal(uniqueCount(s.entries, 2), 0);
  assert.notEqual(demoEvaluation(s).credit, 1);
});
test("partial completion remains unresolved, full approved BI gets only a demo one", () => {
  let s = upsertEntry(initialState(), act({ to: 286 }));
  assert.equal(demoEvaluation(s).credit, null);
  s = upsertEntry(s, act({ surah: 3, to: 200 }));
  assert.equal(demoEvaluation(s).credit, 1);
  s = upsertEntry(s, act({ to: 286, repeat: true }));
  assert.equal(demoEvaluation(s).credit, 1);
});
test("correction preserves revision lineage, reduces coverage and removes linked publication", () => {
  let s = upsertEntry(initialState(), act({ to: 286 }));
  const id = s.entries[0].id;
  s = {
    ...s,
    posts: [
      { id: "post", entryId: id },
      { id: "other", entryId: "other" },
    ],
  };
  s = upsertEntry(s, act({ id, to: 7 }));
  assert.equal(uniqueCount(s.entries, 2), 7);
  assert.equal(s.entries[0].revision, 2);
  assert.equal(s.revisions[0].to, 286);
  assert.deepEqual(
    s.posts.map((p) => p.id),
    ["other"],
  );
});
test("retraction preserves history but removes actual coverage and linked post", () => {
  let s = upsertEntry(initialState(), act());
  const id = s.entries[0].id;
  s.posts = [{ id: "post", entryId: id }];
  s = retractEntry(s, id);
  assert.equal(uniqueCount(s.entries, 2), 0);
  assert.equal(s.revisions.length, 1);
  assert.equal(s.posts.length, 0);
});
test("undo leaves later independent changes intact and does not republish", () => {
  const before = initialState();
  let s = upsertEntry(before, act({ id: "first" }));
  s = upsertEntry(s, act({ id: "second", surah: 3 }));
  s = {
    ...s,
    dhikr: { ...s.dhikr, count: 9 },
    notes: { 1: "later note" },
    posts: [{ id: "p", entryId: "first" }],
  };
  s = undoReadingMutation(s, before, "first");
  assert.equal(s.entries.length, 1);
  assert.equal(s.entries[0].id, "second");
  assert.equal(s.dhikr.count, 9);
  assert.equal(s.notes[1], "later note");
  assert.equal(s.posts.length, 0);
});
test("an unresolved tier never invents a schedule or credit", () => {
  for (const tier of ["BJ1", "BJ2", "BJ3", "BJ4", "BJ5"])
    assert.deepEqual(demoEvaluation({ ...initialState(), tier }), {
      status: "awaiting_policy",
      credit: null,
    });
});
test("late entry never changes the fixed demo today count", () => {
  const s = upsertEntry(initialState(), act({ date: "2026-09-27", to: 286 }));
  assert.equal(uniqueCount(s.entries, 2), 0);
  assert.equal(uniqueCount(s.entries, 2, "2026-09-27"), 286);
});
test("library finds reviewed-example keywords in Arabic and English and supports empty results", () => {
  assert.equal(searchMedia("istighfar")[0].id, "istighfar");
  assert.equal(searchMedia("استغفار")[0].id, "istighfar");
  assert.equal(searchMedia("nothing-matches").length, 0);
  assert.equal(searchMedia("", "القرآن").length, 1);
});
test("juz picker boundaries preserve canonical Baqarah intersections", () => {
  assert.equal(juzStarts.length, 30);
  assert.deepEqual(juzStarts.slice(0, 3), ["1:1", "2:142", "2:253"]);
  for (const start of juzStarts) {
    const [s, a] = start.split(":").map(Number);
    assert.equal(validateRange(s, a, a, quran), true);
  }
});
test("backend contract snapshot confirms BI ranges and unresolved partial policy", () => {
  const fixture = (name) =>
    JSON.parse(
      fs.readFileSync(new URL(`fixtures/${name}.json`, import.meta.url)),
    ).fixture;
  const bi = fixture("today-BI");
  assert.equal(bi.assignment.tier, "BI");
  assert.deepEqual(
    bi.assignment.components.map((c) => c.ranges[0]),
    [
      { start: "2:1", end: "2:286" },
      { start: "3:1", end: "3:200" },
    ],
  );
  const correction = fixture("reader-correction");
  assert.equal(correction.evaluation.creditState, "awaiting_policy");
  assert.equal(correction.evaluation.dayCredit, null);
  assert.equal(correction.evaluation.readerObservedTrace[0].credit, 0);
});
