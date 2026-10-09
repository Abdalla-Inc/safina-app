import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  PAGE_COUNT,
  pageStarts,
  pageForVerse,
  pageDetails,
  versesOnPage,
  surahPages,
  juzPages,
  pageImage,
  validPage,
  swipePageDelta,
} from "../src/data/mushaf.js";
import { juzStarts } from "../src/data/reference.js";
const quran = JSON.parse(
  readFileSync(new URL("../public/data/quran.json", import.meta.url)),
);

test("fixed Madani pages cover all 6236 ayahs exactly once, including multi-surah leaves", () => {
  assert.equal(PAGE_COUNT, 604);
  const refs = [];
  for (let p = 1; p <= 604; p++) {
    const verses = versesOnPage(quran, p);
    assert.ok(verses.length, `page ${p} is not empty`);
    assert.equal(`${verses[0].surah}:${verses[0].id}`, pageStarts[p - 1]);
    verses.forEach((v) => {
      assert.equal(pageForVerse(v.surah, v.id), p);
      refs.push(`${v.surah}:${v.id}`);
    });
  }
  assert.equal(refs.length, 6236);
  assert.equal(new Set(refs).size, 6236);
  assert.deepEqual(
    [...new Set(versesOnPage(quran, 604).map((v) => v.surah))],
    [112, 113, 114],
  );
});
test("all chapter and juz shortcuts resolve to the pinned edition", () => {
  assert.equal(surahPages.length, 114);
  assert.equal(juzPages.length, 30);
  quran.forEach((s) =>
    assert.equal(pageForVerse(s.id, 1), surahPages[s.id - 1]),
  );
  juzStarts.forEach((ref, i) =>
    assert.equal(pageForVerse(...ref.split(":")), juzPages[i]),
  );
  assert.deepEqual(pageDetails(50), { surah: 3, verse: 1, juz: 3 });
  assert.deepEqual(
    versesOnPage(quran, 50).map((v) => v.id),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
  assert.deepEqual(
    versesOnPage(quran, 56).map((v) => v.id),
    [46, 47, 48, 49, 50, 51, 52],
  );
});
test("page and verse bounds reject invalid links; gestures distinguish horizontal turns from taps and scrolls", () => {
  for (const n of [0, 605, -1, NaN, 1.5, "bad", Infinity])
    assert.equal(validPage(n), null);
  assert.equal(validPage("604"), 604);
  for (const ref of [
    [0, 1],
    [115, 1],
    [2, 0],
    [2, 287],
    [1, 8],
    [1.5, 1],
  ])
    assert.equal(pageForVerse(...ref), null);
  assert.equal(swipePageDelta(100, 12), 1);
  assert.equal(swipePageDelta(-100, 12), -1);
  assert.equal(swipePageDelta(47, 0), 0);
  assert.equal(swipePageDelta(60, 80), 0);
  assert.equal(swipePageDelta(100, 100), 0);
  assert.equal(swipePageDelta(0, 0), 0);
});
test("all 604 locally bundled page images retain their downloaded bytes and dimensions", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../public/mushaf/manifest.json", import.meta.url)),
  );
  assert.equal(manifest.pages.length, 604);
  assert.equal(manifest.imageVersion, 8);
  for (const p of manifest.pages) {
    const bytes = readFileSync(
      new URL(`../public${pageImage(p.page)}`, import.meta.url),
    );
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), 1260);
    assert.equal(bytes.readUInt32BE(20), 2038);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      p.sha256,
      `page ${p.page}`,
    );
  }
});
