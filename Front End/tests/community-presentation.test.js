import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { customReadingTasks } from "../src/connected/activityFacts.js";
import { verseForDay } from "../src/data/community.js";
import { weeklyVerse } from "../src/data/communityWeeks.js";
const fact = (selection, ranges) => ({
  kind: "custom_reading",
  selectionIntact: true,
  selection,
  ranges,
});
test("custom posts keep selected surah names even when a surah contains a whole juz", () => {
  const f = fact({ kind: "surah", surahId: 2, fromAyah: 1, toAyah: 286 }, [
    { start: "2:1", end: "2:286" },
  ]);
  assert.deepEqual(
    customReadingTasks({ facts: [f], completedComponents: [] }),
    [{ name: "سورة البقرة", detail: undefined }],
  );
  assert.deepEqual(
    customReadingTasks({
      facts: [f],
      completedComponents: [{ ranges: f.ranges }],
    }),
    [],
  );
});
test("selected juz keeps its name; partial corrections never claim complete surahs", () => {
  const f = fact({ kind: "juz", from: 1, to: 1 }, [
    { start: "1:1", end: "2:141" },
  ]);
  assert.deepEqual(customReadingTasks({ facts: [f] }), [
    { name: "الجزء الأول" },
  ]);
  assert.deepEqual(
    customReadingTasks({
      facts: [
        {
          ...f,
          selectionIntact: false,
          ranges: [{ start: "2:1", end: "2:20" }],
        },
      ],
    }),
    [{ name: "سورة البقرة", detail: "قراءة جزئية" }],
  );
});
test("daily and weekly rotations stay stable within their period and resolve canonical verses", () => {
  const quran = JSON.parse(
    readFileSync(new URL("../public/data/quran.json", import.meta.url)),
  );
  const daily = new Set(),
    weekly = new Set();
  for (let i = 1; i <= 28; i++) {
    const day = `2026-10-${String(i).padStart(2, "0")}`;
    const refs = [verseForDay(day), weeklyVerse(day)];
    assert.deepEqual(verseForDay(day), verseForDay(day));
    for (const [s, v] of refs)
      assert.ok(
        quran.find((c) => c.id === s)?.verses.find((a) => a.id === v)?.text,
      );
    daily.add(refs[0].join(":"));
    weekly.add(refs[1].join(":"));
  }
  assert.equal(daily.size, 5);
  assert.equal(weekly.size, 4);
});

import { localBuildProgress } from "../src/features/safina/localBuildProgress.js";
test("demo ship earns one stage per complete day, caps at 30, and responds to corrections", () => {
  const entry = (date, from = 1, to = 286) => ({
    date,
    from,
    to,
    surah: 2,
    tier: "B",
  });
  const state = {
    tier: "B",
    entries: [
      entry("2026-09-29"),
      entry("2026-09-29"),
      entry("2026-09-30", 1, 20),
    ],
  };
  assert.equal(localBuildProgress(state, "2026-09-30"), 1);
  assert.equal(
    localBuildProgress(
      {
        ...state,
        entries: state.entries.map((e) => ({ ...e, retracted: true })),
      },
      "2026-09-30",
    ),
    0,
  );
  const entries = Array.from({ length: 40 }, (_, i) =>
    entry(new Date(Date.UTC(2026, 7, i + 1)).toISOString().slice(0, 10)),
  );
  assert.equal(localBuildProgress({ ...state, entries }, "2026-09-30"), 30);
  assert.equal(
    localBuildProgress(
      { tier: "BJ2", entries: [{ ...entry("2026-09-30"), tier: "BJ2" }] },
      "2026-09-30",
    ),
    0,
  );
});
