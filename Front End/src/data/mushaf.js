import metadata from "./mushaf-metadata.js";

export const { pageStarts, surahPages, juzPages, verseCounts } = metadata;
export const MUSHAF_EDITION = metadata.edition;
export const PAGE_COUNT = pageStarts.length;
const refValue = (surah, verse) => Number(surah) * 1000 + Number(verse);
const starts = pageStarts.map((ref) => refValue(...ref.split(":")));

export function validPage(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= PAGE_COUNT ? n : null;
}

export function pageForVerse(surah, verse = 1) {
  const s = Number(surah),
    v = Number(verse);
  if (
    !Number.isInteger(s) ||
    !Number.isInteger(v) ||
    s < 1 ||
    s > 114 ||
    v < 1 ||
    v > verseCounts[s - 1]
  )
    return null;
  const target = refValue(s, v);
  const next = starts.findIndex((start) => start > target);
  return next === -1 ? PAGE_COUNT : next;
}

export function pageDetails(page) {
  if (!validPage(page)) return null;
  const [surah, verse] = pageStarts[page - 1].split(":").map(Number);
  const juz = juzPages.reduce(
    (last, start, i) => (start <= page ? i + 1 : last),
    1,
  );
  return { surah, verse, juz };
}

export function versesOnPage(quran, page) {
  if (!validPage(page)) return [];
  const start = starts[page - 1],
    end = starts[page] ?? Infinity;
  return quran.flatMap((s) =>
    s.verses
      .filter(
        (v) => refValue(s.id, v.id) >= start && refValue(s.id, v.id) < end,
      )
      .map((v) => ({ ...v, surah: s.id, surahName: s.name })),
  );
}

export function pageImage(page) {
  return `/mushaf/madani-v8/page${String(page).padStart(3, "0")}.png`;
}

// The next leaf of an Arabic book is turned to the right. Vertical motion,
// a tap, or a diagonal scroll must never accidentally turn a page.
export function swipePageDelta(dx, dy) {
  return Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5
    ? dx > 0
      ? 1
      : -1
    : 0;
}
