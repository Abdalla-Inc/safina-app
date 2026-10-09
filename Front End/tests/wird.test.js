import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  DEMO_DATE,
  upsertEntry,
  componentStatus,
  demoEvaluation,
} from "../src/data/model.js";
import {
  wirdRows,
  setWirdCompletion,
  addWirdPartial,
  completedSwipe,
} from "../src/data/wird.js";

test("Today only exposes approved selected commitments, never extra surahs or invented juz assignments", () => {
  const state = initialState();
  assert.deepEqual(
    wirdRows(state).map((r) => r.surah),
    [2, 3],
  );
  assert.deepEqual(
    wirdRows({ ...state, tier: "B" }).map((r) => r.surah),
    [2],
  );
  for (const tier of ["BJ1", "BJ2", "BJ3", "BJ4", "BJ5"])
    assert.deepEqual(wirdRows({ ...state, tier }), []);
  for (const scenario of ["free", "policy", "error"])
    assert.deepEqual(wirdRows({ ...state, scenario }), []);
  assert.equal(
    addWirdPartial({ ...state, tier: "B" }, 3, 1, 10).entries.length,
    0,
  );
  assert.equal(setWirdCompletion(state, 112, true), state);
});
test("crossing completes a task once; reopening retains earlier partial reading and unrelated data", () => {
  let state = addWirdPartial(initialState(), 2, 1, 10);
  state = upsertEntry(state, { surah: 3, from: 1, to: 5, date: DEMO_DATE });
  state = upsertEntry(state, {
    surah: 2,
    from: 1,
    to: 286,
    date: "2026-09-27",
  });
  state = { ...state, notes: { a: "keep me" } };
  const completed = setWirdCompletion(state, 2, true);
  assert.equal(componentStatus(completed.entries, 2, 286).status, "complete");
  assert.equal(setWirdCompletion(completed, 2, true), completed);
  const reopened = setWirdCompletion(completed, 2, false);
  assert.equal(componentStatus(reopened.entries, 2, 286).count, 10);
  assert.equal(componentStatus(reopened.entries, 3, 200).count, 5);
  assert.equal(
    componentStatus(reopened.entries, 2, 286, "2026-09-27").status,
    "complete",
  );
  assert.deepEqual(reopened.notes, { a: "keep me" });
  assert.equal(reopened.revisions.length, 1);
});
test("union of partial ranges can complete a capsule; reopening removes completion and invalidates related shared posts", () => {
  let state = addWirdPartial(initialState(), 2, 1, 150);
  state = addWirdPartial(state, 2, 101, 286);
  assert.equal(componentStatus(state.entries, 2, 286).count, 286);
  state = {
    ...state,
    posts: [
      { id: "related", entryId: state.entries[0].id },
      { id: "unrelated", entryId: "other" },
    ],
  };
  const reopened = setWirdCompletion(state, 2, false);
  assert.equal(componentStatus(reopened.entries, 2, 286).count, 0);
  assert.equal(reopened.revisions.length, 2);
  assert.deepEqual(reopened.posts, [{ id: "unrelated", entryId: "other" }]);
});
test("partial progress validates assignment bounds, de-duplicates overlap, and creates no credit for unassigned reading", () => {
  let state = { ...initialState(), tier: "B" };
  for (const [s, a, b] of [
    [2, 0, 5],
    [2, 20, 10],
    [2, 1, 287],
    [2, 1.5, 3],
    [3, 1, 5],
    [112, 1, 4],
  ])
    assert.equal(addWirdPartial(state, s, a, b), state);
  state = addWirdPartial(state, 2, 1, 20);
  assert.equal(addWirdPartial(state, 2, 5, 15), state);
  state = addWirdPartial(state, 2, 10, 30);
  assert.equal(componentStatus(state.entries, 2, 286).count, 30);
  assert.equal(demoEvaluation(state).credit, null);
  const outside = upsertEntry(
    { ...initialState(), tier: "B" },
    { surah: 112, from: 1, to: 4, date: DEMO_DATE },
  );
  assert.equal(demoEvaluation(outside).status, "no_entry");
});
test("swipe threshold prevents short, wrong-direction and vertical gestures from completing or undoing", () => {
  assert.equal(completedSwipe(240, 5, 280, false), true);
  assert.equal(completedSwipe(-240, 5, 280, true), true);
  for (const [dx, dy, done] of [
    [40, 0, false],
    [-240, 0, false],
    [240, 0, true],
    [200, 200, false],
    [10, 200, false],
  ])
    assert.equal(completedSwipe(dx, dy, 280, done), false);
});
