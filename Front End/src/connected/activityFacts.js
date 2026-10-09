import { juzStarts } from "../data/reference.js";
import { juzName } from "../data/juzNames.js";
import { chapters } from "../data/dailyActivity.js";
// Presentation only: union custom evidence and hide coverage already named by assigned rows.
// This never produces credit or writes a reading report.
const keys = chapters.flatMap((s) =>
  Array.from({ length: s.total_verses }, (_, i) => `${s.id}:${i + 1}`),
);
const positions = new Map(keys.map((k, i) => [k, i]));
function cover(ranges) {
  const result = new Set();
  for (const r of ranges || []) {
    const a = positions.get(r.start),
      b = positions.get(r.end);
    if (a === undefined || b === undefined || a > b) continue;
    for (let i = a; i <= b; i++) result.add(i);
  }
  return result;
}
export function customDisplayRanges(card) {
  const custom = cover(
    card.facts
      ?.filter((f) => f.kind === "custom_reading")
      .flatMap((f) => f.ranges),
  );
  for (const i of cover(card.completedComponents?.flatMap((c) => c.ranges)))
    custom.delete(i);
  const sorted = [...custom].sort((a, b) => a - b),
    ranges = [];
  let start, last;
  for (const i of sorted) {
    if (
      last !== undefined &&
      (i !== last + 1 || keys[i].split(":")[0] !== keys[last].split(":")[0])
    ) {
      ranges.push({ start: keys[start], end: keys[last] });
      start = undefined;
    }
    if (start === undefined) start = i;
    last = i;
  }
  if (start !== undefined) ranges.push({ start: keys[start], end: keys[last] });
  return ranges;
}

// Canonical coverage → readable names; never infer completion from a partial range.
export function namedReadingTasks(ranges) {
  const remaining = cover(ranges),
    tasks = [];
  for (let j = 0; j < juzStarts.length; j++) {
    const start = positions.get(juzStarts[j]);
    const end = j === 29 ? keys.length : positions.get(juzStarts[j + 1]);
    let full = true;
    for (let i = start; i < end; i++)
      if (!remaining.has(i)) {
        full = false;
        break;
      }
    if (!full) continue;
    tasks.push({ name: juzName(j + 1) });
    for (let i = start; i < end; i++) remaining.delete(i);
  }
  for (const chapter of chapters) {
    const start = positions.get(`${chapter.id}:1`);
    const count = Array.from(
      { length: chapter.total_verses },
      (_, i) => start + i,
    ).filter((i) => remaining.has(i)).length;
    if (count)
      tasks.push({
        name: `سورة ${chapter.name}`,
        detail: count === chapter.total_verses ? undefined : "قراءة جزئية",
      });
  }
  return tasks;
}

export function customReadingTasks(card) {
  const remaining = cover(customDisplayRanges(card)),
    tasks = [];
  for (const fact of card.facts || []) {
    if (fact.kind !== "custom_reading" || !fact.selectionIntact) continue;
    const coverage = cover(fact.ranges);
    if (!coverage.size || ![...coverage].every((i) => remaining.has(i)))
      continue;
    const s = fact.selection;
    if (s?.kind === "juz") {
      for (let j = s.from; j <= s.to; j++) tasks.push({ name: juzName(j) });
    } else if (s?.kind === "surah") {
      const chapter = chapters.find((c) => c.id === s.surahId);
      if (!chapter) continue;
      tasks.push({
        name: `سورة ${chapter.name}`,
        detail:
          s.fromAyah === 1 && s.toAyah === chapter.total_verses
            ? undefined
            : "قراءة جزئية",
      });
    } else continue;
    for (const i of coverage) remaining.delete(i);
  }
  // Corrections or overlap can break an original selection: describe remaining evidence honestly.
  for (const chapter of chapters) {
    const first = positions.get(`${chapter.id}:1`);
    const count = Array.from(
      { length: chapter.total_verses },
      (_, i) => first + i,
    ).filter((i) => remaining.has(i)).length;
    if (count)
      tasks.push({
        name: `سورة ${chapter.name}`,
        detail: count === chapter.total_verses ? undefined : "قراءة جزئية",
      });
  }
  return tasks;
}
