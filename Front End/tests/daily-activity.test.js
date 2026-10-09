import test from "node:test";
import assert from "node:assert/strict";
import { initialState, componentStatus } from "../src/data/model.js";
import {
  chapters,
  customRanges,
  addCustomReading,
  removeCustomReading,
  istighfarForDay,
  setIstighfar,
  saveCustomWird,
} from "../src/data/dailyActivity.js";
import { reconcileCheckins, completedPeople } from "../src/data/community.js";
import { ownReadingWeeks } from "../src/data/communityWeeks.js";
import { selectedReaction, toggleReaction } from "../src/data/reactions.js";
import {
  countryCodes,
  countryFlag,
  countryName,
} from "../src/data/countries.js";
const day = "2026-10-01",
  instant = new Date(day + "T12:00:00+03:00");
const reconcile = (a, b) => reconcileCheckins(a, b, instant);
test("all thirty canonical juz partition every verse exactly once", () => {
  const counts = new Map();
  for (let j = 1; j <= 30; j++)
    for (const r of customRanges({ kind: "juz", from: j, to: j }))
      for (let v = r.from; v <= r.to; v++) {
        const k = `${r.surah}:${v}`;
        counts.set(k, (counts.get(k) || 0) + 1);
      }
  assert.equal(counts.size, 6236);
  assert.ok([...counts.values()].every((n) => n === 1));
  assert.deepEqual(customRanges({ kind: "juz", from: 1, to: 1 }), [
    { surah: 1, from: 1, to: 7 },
    { surah: 2, from: 1, to: 141 },
  ]);
  assert.throws(() => customRanges({ kind: "juz", from: 0, to: 31 }));
  assert.throws(() =>
    customRanges({ kind: "surah", surah: 2, from: 10, to: 1 }),
  );
});
test("custom partial posts and weekly history survive outside commitment without awarding assigned completion", () => {
  const a = initialState();
  const b = reconcile(
    a,
    addCustomReading(a, { kind: "surah", surah: 36, from: 1, to: 20 }, day),
  );
  assert.equal(b.communityCheckins.length, 1);
  assert.equal(completedPeople(b.communityCheckins, day), 0);
  assert.match(b.communityCheckins[0].tasks[0].name, /يس/);
  assert.equal(ownReadingWeeks(b, chapters, day)[0].days[0].items[0].count, 20);
  const c = addCustomReading(
    b,
    { kind: "surah", surah: 36, from: 1, to: 20 },
    day,
  );
  assert.equal(c, b);
  const d = reconcile(b, removeCustomReading(b, b.entries[0].customGroupId));
  assert.equal(d.communityCheckins.length, 0);
  assert.equal(ownReadingWeeks(d, chapters, day).length, 0);
});
test("overlapping custom surah and juz coverage is unioned and grouped removal preserves other reading", () => {
  const a = addCustomReading(
    initialState(),
    { kind: "surah", surah: 2, from: 1, to: 20 },
    day,
  );
  const b = addCustomReading(a, { kind: "juz", from: 1, to: 1 }, day);
  assert.equal(componentStatus(b.entries, 2, 286, day).count, 141);
  assert.equal(
    ownReadingWeeks(b, chapters, day)[0].days[0].items.find(
      (i) => i.name === "سورة البقرة",
    ).count,
    141,
  );
  const c = removeCustomReading(b, b.entries.at(-1).customGroupId);
  assert.equal(componentStatus(c.entries, 2, 286, day).count, 20);
});
test("istighfar is day scoped, target snapshotted, correctable, and never Quran credit", () => {
  const a = initialState();
  const b = reconcile(a, setIstighfar(a, day, 50));
  assert.equal(b.communityCheckins[0].complete, false);
  assert.equal(b.communityCheckins[0].istighfarComplete, false);
  assert.equal(istighfarForDay({ ...b, istighfarGoal: 200 }, day).target, 100);
  assert.deepEqual(
    istighfarForDay({ ...b, istighfarGoal: 200 }, "2026-10-02"),
    { count: 0, target: 200 },
  );
  const c = reconcile(b, setIstighfar(b, day, 150));
  assert.equal(c.communityCheckins[0].istighfarComplete, true);
  const week = ownReadingWeeks(c, chapters, day)[0];
  assert.equal(week.readingDays, 0);
  assert.equal(week.activityDays, 1);
  assert.equal(week.days[0].items[0].count, 150);
  const d = reconcile(c, setIstighfar(c, day, 0));
  assert.equal(d.communityCheckins.length, 0);
  assert.throws(() => setIstighfar(d, day, -1));
  assert.throws(() => setIstighfar(d, day, 1.5));
});
test("country updates propagate without reordering posts or publishing private history", () => {
  const a = initialState();
  const b = reconcile(a, setIstighfar(a, day, 100));
  const c = reconcileCheckins(
    b,
    { ...b, countryCode: "SD" },
    new Date(day + "T13:00:00+03:00"),
  );
  assert.equal(c.communityCheckins[0].countryCode, "SD");
  assert.equal(
    c.communityCheckins[0].updatedAt,
    b.communityCheckins[0].updatedAt,
  );
  assert.equal(
    reconcile(a, { ...a, countryCode: "AU" }).communityCheckins.length,
    0,
  );
  assert.equal(new Set(countryCodes).size, 249);
  assert.equal(countryFlag("SD"), "🇸🇩");
  assert.ok(countryName("SA"));
  assert.equal(countryFlag("XX"), "");
});
test("reaction migration, replacement, and removal preserve one viewer reaction", () => {
  const a = { communityHearts: ["post"] };
  assert.equal(selectedReaction(a, "post"), "❤️");
  const b = toggleReaction(a, "post", "👏");
  assert.equal(selectedReaction(b, "post"), "👏");
  assert.deepEqual(b.communityHearts, []);
  const c = toggleReaction(b, "post", "👏");
  assert.equal(selectedReaction(c, "post"), null);
  assert.equal(toggleReaction(c, "post", "invalid"), c);
});
test("full custom assigned coverage satisfies only that component and does not duplicate its card label", () => {
  const a = initialState();
  const b = reconcile(
    a,
    addCustomReading(a, { kind: "surah", surah: 2, from: 1, to: 286 }, day),
  );
  assert.equal(b.communityCheckins[0].tasks.length, 1);
  assert.equal(b.communityCheckins[0].tasks[0].surah, 2);
  assert.equal(b.communityCheckins[0].complete, false);
  const c = reconcile(
    b,
    addCustomReading(b, { kind: "surah", surah: 3, from: 1, to: 200 }, day),
  );
  assert.equal(c.communityCheckins[0].tasks.length, 2);
  assert.equal(completedPeople(c.communityCheckins, day), 1);
});

test("multi-select mixed custom wird commits one community update and a replacement istighfar total", () => {
  const a = initialState();
  const b = reconcile(
    a,
    saveCustomWird(
      a,
      {
        surahs: [{ surah: 36 }, { surah: 67 }],
        juz: [1, 3],
        istighfarCount: 45,
      },
      day,
    ),
  );
  assert.equal(b.communityCheckins.length, 1);
  assert.equal(componentStatus(b.entries, 36, 83, day).status, "complete");
  assert.equal(componentStatus(b.entries, 67, 30, day).status, "complete");
  assert.equal(componentStatus(b.entries, 2, 286, day).status, "partial");
  assert.equal(b.communityCheckins[0].complete, false);
  assert.equal(b.communityCheckins[0].istighfarComplete, false);
  assert.equal(istighfarForDay(b, day).count, 45);
  const c = saveCustomWird(
    b,
    { surahs: [{ surah: 36 }, { surah: 67 }], juz: [1, 3], istighfarCount: 45 },
    day,
  );
  assert.equal(c, b);
  const d = reconcile(b, saveCustomWird(b, { istighfarCount: 60 }, day));
  assert.equal(istighfarForDay(d, day).count, 60);
  assert.equal(d.communityCheckins.length, 1);
});
test("invalid multi-selection cannot partially save readings or istighfar", () => {
  const a = initialState();
  assert.throws(() =>
    saveCustomWird(
      a,
      { surahs: [{ surah: 36 }], juz: [31], istighfarCount: 50 },
      day,
    ),
  );
  assert.throws(() =>
    saveCustomWird(a, { surahs: [{ surah: 36 }], istighfarCount: -1 }, day),
  );
  assert.throws(() => saveCustomWird(a, {}, day));
  assert.equal(a.entries.length, 0);
  assert.deepEqual(a.istighfarDays, {});
});
test("a batch retains partial verse ranges and untouched istighfar when blank", () => {
  const a = setIstighfar(initialState(), day, 75);
  const b = saveCustomWird(
    a,
    { surahs: [{ surah: 36, from: 5, to: 20 }, { surah: 67 }], juz: [] },
    day,
  );
  assert.equal(componentStatus(b.entries, 36, 83, day).count, 16);
  assert.equal(istighfarForDay(b, day).count, 75);
  assert.equal(
    istighfarForDay(saveCustomWird(b, { istighfarCount: 0 }, day), day).count,
    0,
  );
});
