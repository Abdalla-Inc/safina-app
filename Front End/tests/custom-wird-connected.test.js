import test from "node:test";
import assert from "node:assert/strict";
import {
  customWirdBatch,
  continueCustomWird,
} from "../src/connected/customWird.js";
const data = {
  assignment: { referenceVersion: "hafs-tanzil-1.0-20260928" },
  assignmentDay: "2026-10-01",
  istighfar: { count: 50, revision: 2 },
};
test("connected multi-select produces canonical selections and absolute count in one frozen submission", () => {
  const batch = customWirdBatch(data, {
    surahs: [{ surah: 18 }, { surah: 55 }],
    juz: [1, 3],
    istighfarCount: 20000,
  });
  assert.equal(batch.steps.length, 5);
  assert.deepEqual(batch.steps[0].body.selection, {
    kind: "surah",
    surahId: 18,
    fromAyah: 1,
    toAyah: 110,
  });
  assert.deepEqual(batch.steps[3].body.selection, {
    kind: "juz",
    from: 3,
    to: 3,
  });
  assert.equal(batch.steps[4].body.count, 20000);
  assert.equal(batch.steps[4].body.expectedRevision, 2);
  assert.equal(new Set(batch.steps.map((s) => s.body.mutationId)).size, 5);
  assert.equal(new Set(batch.steps.map((s) => s.body.occurredAt)).size, 1);
});
test("failed connected submit resumes the same mutation without re-sending earlier acknowledged steps", async () => {
  const batch = customWirdBatch(data, {
    surahs: [{ surah: 18 }, { surah: 55 }],
    istighfarCount: 1000,
  });
  const calls = [];
  await assert.rejects(
    continueCustomWird(batch, async (p, m, b) => {
      calls.push(b.mutationId);
      return calls.length !== 2;
    }),
  );
  assert.equal(batch.cursor, 1);
  const failed = batch.steps[1].body;
  await continueCustomWird(batch, async (p, m, b) => {
    calls.push(b.mutationId);
    return true;
  });
  assert.equal(batch.cursor, 3);
  assert.equal(calls[1], calls[2]);
  assert.equal(batch.steps[1].body, failed);
  assert.equal(
    calls.filter((id) => id === batch.steps[0].body.mutationId).length,
    1,
  );
});
test("connected selections validate before creating any write; absent or unchanged count stays untouched", () => {
  assert.throws(() =>
    customWirdBatch(data, { surahs: [{ surah: 999 }], istighfarCount: 100 }),
  );
  assert.equal(
    customWirdBatch(data, { surahs: [{ surah: 1 }] }).steps.length,
    1,
  );
  assert.equal(
    customWirdBatch(data, { surahs: [{ surah: 1 }], istighfarCount: 50 }).steps
      .length,
    1,
  );
  assert.equal(
    customWirdBatch(data, { istighfarCount: 0 }).steps[0].body.count,
    0,
  );
});
