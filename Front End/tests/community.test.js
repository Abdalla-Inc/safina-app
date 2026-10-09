import test from "node:test";
import assert from "node:assert/strict";
import { initialState, upsertEntry, retractEntry } from "../src/data/model.js";
import { setWirdCompletion, addWirdPartial } from "../src/data/wird.js";
import {
  meccaDay,
  nextMeccaMidnight,
  reconcileCheckins,
  dailyCheckins,
  completedPeople,
  verseForDay,
} from "../src/data/community.js";
const now = "2026-09-29T09:00:00Z",
  day = "2026-09-29";
const apply = (s, mut, time = now) => reconcileCheckins(s, mut(s), time);
const complete = (s, id) =>
  apply(s, (p) => setWirdCompletion(p, id, true, day));
test("Mecca day and midnight are independent of the device timezone, including month/year rollover", () => {
  assert.equal(meccaDay("2026-09-29T20:59:59.999Z"), "2026-09-29");
  assert.equal(meccaDay("2026-09-29T21:00:00.000Z"), "2026-09-30");
  assert.equal(meccaDay("2026-12-31T21:00:00.000Z"), "2027-01-01");
  assert.equal(
    nextMeccaMidnight("2026-09-29T20:59:00Z"),
    Date.parse("2026-09-29T21:00:00Z"),
  );
  assert.equal(
    nextMeccaMidnight("2026-09-29T21:00:00Z"),
    Date.parse("2026-09-30T21:00:00Z"),
  );
});
test("each completed assigned task updates one daily entry, while only a full wird increments the people counter", () => {
  let s = apply(initialState(), (p) => addWirdPartial(p, 2, 1, 10, day));
  assert.equal(s.communityCheckins.length, 0);
  s = complete(s, 2);
  assert.equal(s.communityCheckins.length, 1);
  assert.deepEqual(
    s.communityCheckins[0].tasks.map((t) => t.surah),
    [2],
  );
  assert.equal(completedPeople(s.communityCheckins, day), 0);
  const id = s.communityCheckins[0].id;
  s = complete(s, 3);
  assert.equal(s.communityCheckins.length, 1);
  assert.equal(s.communityCheckins[0].id, id);
  assert.deepEqual(
    s.communityCheckins[0].tasks.map((t) => t.surah),
    [2, 3],
  );
  assert.equal(completedPeople(s.communityCheckins, day), 1);
  s = complete(s, 3);
  assert.equal(completedPeople(s.communityCheckins, day), 1);
  assert.equal(completedPeople(s.communityCheckins, "2026-09-30"), 0);
});
test("correction, retraction and reopening revise the feed and its counter without stale completed claims", () => {
  let s = complete(complete(initialState(), 2), 3);
  s = apply(s, (p) => setWirdCompletion(p, 2, false, day));
  assert.equal(completedPeople(s.communityCheckins, day), 0);
  assert.deepEqual(
    s.communityCheckins[0].tasks.map((t) => t.surah),
    [3],
  );
  s = apply(s, (p) =>
    retractEntry(p, p.entries.find((e) => e.surah === 3 && !e.retracted).id),
  );
  assert.equal(s.communityCheckins.length, 0);
});
test("outside, backdated, unconfirmed and duplicate reading do not create extra community completion", () => {
  const start = initialState();
  let s = apply(start, (p) =>
    upsertEntry(p, { surah: 112, from: 1, to: 4, date: day }),
  );
  assert.equal(s.communityCheckins.length, 0);
  s = apply(s, (p) => setWirdCompletion(p, 2, true, "2026-09-28"));
  assert.equal(s.communityCheckins.length, 0);
  s = apply(s, (p) => ({ ...p, trace: { surah: 3, from: 1, to: 200 } }));
  assert.equal(s.communityCheckins.length, 0);
  s = complete(complete(s, 2), 3);
  const time = s.communityCheckins[0].updatedAt;
  s = apply(
    s,
    (p) =>
      upsertEntry(p, { surah: 2, from: 1, to: 286, date: day, repeat: true }),
    "2026-09-29T11:00:00Z",
  );
  assert.equal(s.communityCheckins[0].updatedAt, time);
  assert.equal(s.communityCheckins.length, 1);
});
test("historical corrections stay on their original day; current midnight starts a fresh feed", () => {
  let s = complete(complete(initialState(), 2), 3);
  const oldId = s.entries.find((e) => e.surah === 2).id;
  s = apply(
    s,
    (p) => upsertEntry(p, { id: oldId, surah: 2, from: 1, to: 10, date: day }),
    "2026-09-29T21:01:00Z",
  );
  assert.equal(dailyCheckins(s.communityCheckins, "2026-09-30").length, 0);
  assert.equal(s.communityCheckins[0].day, day);
  assert.equal(completedPeople(s.communityCheckins, day), 0);
});
test("member/day aggregation is unique and ayah rotation uses complete canonical references", () => {
  const posts = [
    { memberId: "a", day, complete: true, updatedAt: "2026-09-29T01:00:00Z" },
    { memberId: "a", day, complete: false, updatedAt: "2026-09-29T02:00:00Z" },
    { memberId: "b", day, complete: true, updatedAt: "2026-09-29T03:00:00Z" },
  ];
  assert.equal(dailyCheckins(posts, day).length, 2);
  assert.equal(completedPeople(posts, day), 1);
  for (const d of ["2026-09-29", "2026-09-30", "2026-10-01"])
    assert.ok(
      [
        [83, 26],
        [3, 133],
        [57, 21],
      ].some((r) => JSON.stringify(r) === JSON.stringify(verseForDay(d))),
    );
});

test("a mutation unrelated to already-private completed tasks never backfills their first publication", () => {
  let privateState = setWirdCompletion(initialState(), 2, true, day);
  privateState = setWirdCompletion(privateState, 3, true, day);
  const s = apply(privateState, (p) =>
    upsertEntry(p, { surah: 112, from: 1, to: 4, date: day }),
  );
  assert.equal(s.communityCheckins.length, 0);
});

test("completion snapshots retain their level after a later profile change", () => {
  let state = complete(complete(initialState(), 2), 3);
  assert.equal(state.communityCheckins[0].tierAtCompletion, "BI");
  state = apply(state, (s) => ({ ...s, tier: "BJ5" }), "2026-09-30T09:00:00Z");
  assert.equal(state.communityCheckins[0].tierAtCompletion, "BI");
  assert.equal(state.communityCheckins[0].day, day);
});
