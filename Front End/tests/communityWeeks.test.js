import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  readingWeek,
  shiftDay,
  ownReadingWeeks,
  exampleOwnWeeks,
  exampleCelebration,
  weeklyVerse,
} from "../src/data/communityWeeks.js";
import { meccaDay } from "../src/data/community.js";
import { initialState } from "../src/data/model.js";
const quran = JSON.parse(
  readFileSync(new URL("../public/data/quran.json", import.meta.url)),
);
const record = (date, from, to, extra = {}) => ({
  id: `${date}:${from}`,
  date,
  surah: 2,
  from,
  to,
  tier: "BI",
  ...extra,
});
const weeks = (entries, day = "2026-10-03", extra = {}) =>
  ownReadingWeeks({ ...initialState(), entries, ...extra }, quran, day);

test("Saturday celebration uses Mecca midnight and Sunday-to-Saturday civil weeks across years", () => {
  assert.equal(readingWeek(meccaDay("2026-10-02T20:59:59Z")).saturday, false);
  assert.equal(readingWeek(meccaDay("2026-10-02T21:00:00Z")).saturday, true);
  assert.deepEqual(readingWeek("2026-10-03"), {
    start: "2026-09-27",
    end: "2026-10-03",
    saturday: true,
  });
  assert.equal(readingWeek("2026-10-04").start, "2026-10-04");
  assert.equal(readingWeek("2027-01-01").start, "2026-12-27");
  assert.equal(shiftDay("2028-02-28", 2), "2028-03-01");
});
test("partial reading participates without daily completion, future or outside-plan claims", () => {
  const result = weeks([
    record("2026-09-28", 1, 20),
    record("2026-09-29", 1, 10, { surah: 3 }),
    record("2026-09-29", 1, 4, { surah: 112 }),
    record("2026-10-04", 1, 286),
    record("2026-09-29", 0, 300),
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].readingDays, 2);
  assert.equal(result[0].tasks[0].detail, "١٠ آية في قراءات جزئية");
  assert.equal(result[0].tasks[1].detail, "٢٠ آية في قراءات جزئية");
  assert.ok(!result[0].tasks.some((t) => t.name.includes("ختمة")));
});
test("overlaps, duplicates and repeat flags do not invent additional complete readings", () => {
  const result = weeks([
    record("2026-09-28", 1, 200),
    record("2026-09-28", 100, 286),
    record("2026-09-28", 1, 286, { repeat: true }),
  ]);
  assert.equal(result[0].tasks[0].detail, "قراءة كاملة");
  assert.equal(result[0].days[0].items[0].count, 286);
});
test("surah coverage across days is one complete surah, never a Quran khatma", () => {
  const result = weeks([
    record("2026-09-28", 1, 140),
    record("2026-09-29", 141, 286),
  ]);
  assert.equal(result[0].tasks[0].detail, "قراءة كاملة");
  assert.ok(result[0].days.every((d) => !d.items[0].complete));
  assert.equal(result[0].tasks[0].name, "سورة البقرة");
});
test("daily full readings count separately; correction/retraction recomputes or removes a week", () => {
  const entries = [record("2026-09-28", 1, 286), record("2026-09-29", 1, 286)];
  assert.equal(weeks(entries)[0].tasks[0].detail, "قراءتان كاملتان");
  assert.equal(
    weeks([entries[0], { ...entries[1], retracted: true }])[0].readingDays,
    1,
  );
  assert.equal(
    weeks(entries.map((e) => ({ ...e, retracted: true }))).length,
    0,
  );
  assert.equal(
    weeks([record("2026-09-28", 1, 10)])[0].tasks[0].detail,
    "١٠ آية في قراءات جزئية",
  );
});
test("archive is newest first, honors stored levels and preserves a mixed-tier week/day", () => {
  const result = weeks(
    [
      record("2026-09-20", 1, 286, { tier: "B" }),
      record("2026-09-28", 1, 100, { tier: "B" }),
      record("2026-09-28", 101, 286, { tier: "BI" }),
      record("2026-09-29", 1, 286, { tier: "BI" }),
    ],
    "2026-10-03",
    { tier: "BJ5" },
  );
  assert.deepEqual(
    result.map((w) => w.weekStart),
    ["2026-09-27", "2026-09-20"],
  );
  assert.equal(result[0].tierAtCompletion, "BI");
  assert.equal(result[1].tierAtCompletion, "B");
  assert.deepEqual(result[0].days[1].items[0].levels, ["B", "BI"]);
  const legacy = weeks([record("2026-09-28", 1, 10, { tier: undefined })]);
  assert.equal(legacy[0].tierAtCompletion, null);
});
test("Saturday optional actual reading belongs to the week; it is never a required-day assertion", () => {
  const result = weeks([record("2026-10-03", 1, 5)]);
  assert.equal(result[0].weekStart, "2026-09-27");
  assert.equal(result[0].readingDays, 1);
  assert.equal(result[0].complete, undefined);
});
test("sample history shows four ordered weeks and a level change, with all dates at or before today", () => {
  const result = exampleOwnWeeks("2026-09-29");
  assert.equal(result.length, 4);
  assert.deepEqual(
    result.map((p) => p.tierAtCompletion),
    ["BI", "BI", "BI", "B"],
  );
  assert.ok(
    result.every(
      (p) =>
        p.example &&
        p.id.startsWith("week:example-own:") &&
        p.days.every((d) => d.date <= "2026-09-29"),
    ),
  );
  assert.ok(
    result.every((p, i) => !i || p.weekStart < result[i - 1].weekStart),
  );
  const celebration = exampleCelebration("2026-09-27");
  assert.equal(celebration.length, 14);
  assert.ok(celebration.every((p) => p.example && p.weekly));
  assert.ok(
    celebration.some((p) => p.tasks.some((t) => t.detail?.includes("جزئية"))),
  );
  assert.ok(
    celebration.some((p) => p.tasks.some((t) => t.name.includes("ختمة"))),
  );
});
test("celebration verse references point to complete locally pinned Quran verses", () => {
  for (const date of ["2026-09-27", "2026-10-04"]) {
    const [surah, ayah] = weeklyVerse(date);
    assert.ok(quran[surah - 1].verses.find((v) => v.id === ayah)?.text);
    assert.ok(
      [
        [53, 39],
        [76, 22],
      ].some(([s, a]) => s === surah && a === ayah),
    );
  }
});
