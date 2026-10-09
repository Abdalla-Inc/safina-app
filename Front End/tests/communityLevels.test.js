import test from "node:test";
import assert from "node:assert/strict";
import { tiers } from "../src/data/model.js";
import {
  communityLevels,
  checkinPalette,
  checkinTier,
} from "../src/data/communityLevels.js";
import { exampleCheckins, completedPeople } from "../src/data/community.js";

test("each engine tier has a distinct, readable community accent", () => {
  assert.deepEqual(
    Object.keys(communityLevels).sort(),
    tiers.map((t) => t.id).sort(),
  );
  assert.equal(
    new Set(Object.values(communityLevels).map((p) => p.accent)).size,
    tiers.length,
  );
  function luminance(hex) {
    const c = hex
      .match(/[a-f\d]{2}/gi)
      .map((s) => parseInt(s, 16) / 255)
      .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  }
  for (const p of Object.values(communityLevels)) {
    assert.ok(
      (luminance(p.tint) + 0.05) / (luminance(p.accent) + 0.05) >= 4.5,
      p.label,
    );
  }
});
test("legacy post colors come from their assignment; unknown levels stay neutral", () => {
  assert.equal(checkinTier({ assignment: [{ surah: 3 }, { surah: 2 }] }), "BI");
  assert.equal(checkinTier({ assignment: [{ surah: 2 }] }), "B");
  assert.equal(checkinTier({ assignment: [{ surah: 112 }] }), null);
  assert.equal(
    checkinPalette({ tierAtCompletion: "future-level" }).label,
    "ورد القراءة",
  );
  assert.equal(
    checkinTier({ tierAtCompletion: "BJ5", assignment: [{ surah: 2 }] }),
    "BJ5",
  );
});
test("samples cover all levels, stay explicitly fictional, and remain inside the Mecca day", () => {
  for (const now of [
    "2026-09-28T21:00:00Z",
    "2026-09-29T08:00:00Z",
    "2026-10-01T01:00:00Z",
  ]) {
    const posts = exampleCheckins("2026-09-29", now);
    assert.equal(posts.length, 14);
    assert.equal(completedPeople(posts, "2026-09-29"), 14);
    assert.equal(new Set(posts.map((p) => p.tierAtCompletion)).size, 7);
    for (const p of posts) {
      assert.ok(
        p.example && p.memberId.startsWith("example-") && p.heartCount > 1,
      );
      assert.ok(Date.parse(p.updatedAt) >= Date.parse("2026-09-28T21:00:00Z"));
      assert.ok(Date.parse(p.updatedAt) < Date.parse("2026-09-29T21:00:00Z"));
    }
  }
});
