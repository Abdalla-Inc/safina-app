import { juzName } from "./juzNames.js";
import { juzStarts } from "./reference.js";
import { upsertEntry, retractEntry } from "./model.js";
import chapters from "./chapterSummary.js";
export { chapters };
const ar = (n) => new Intl.NumberFormat("ar-EG").format(n);
export function customRanges(input) {
  if (input.kind === "juz") {
    if (
      !Number.isInteger(input.from) ||
      !Number.isInteger(input.to) ||
      input.from < 1 ||
      input.to < input.from ||
      input.to > 30
    )
      throw new Error("اختر الأجزاء من ١ إلى ٣٠");
    const [ss, sv] = juzStarts[input.from - 1].split(":").map(Number);
    const [es, ev] =
      input.to === 30 ? [114, 7] : juzStarts[input.to].split(":").map(Number);
    return chapters
      .filter((s) => s.id >= ss && s.id <= es)
      .map((s) => ({
        surah: s.id,
        from: s.id === ss ? sv : 1,
        to: s.id === es ? ev - 1 : s.total_verses,
      }))
      .filter((r) => r.to >= r.from);
  }
  const s = chapters.find((s) => s.id === input.surah);
  if (
    !s ||
    !Number.isInteger(input.from) ||
    !Number.isInteger(input.to) ||
    input.from < 1 ||
    input.to < input.from ||
    input.to > s.total_verses
  )
    throw new Error("راجع بداية القراءة ونهايتها");
  return [{ surah: s.id, from: input.from, to: input.to }];
}
export function addCustomReading(state, input, date) {
  const ranges = customRanges(input);
  const covered = (r) => {
    const verses = new Set();
    state.entries
      .filter((e) => !e.retracted && e.date === date && e.surah === r.surah)
      .forEach((e) => {
        for (let n = e.from; n <= e.to; n++) verses.add(n);
      });
    return Array.from(
      { length: r.to - r.from + 1 },
      (_, i) => r.from + i,
    ).every((n) => verses.has(n));
  };
  if (ranges.every(covered)) return state;
  const customGroupId = crypto.randomUUID();
  return ranges.reduce(
    (s, r) =>
      upsertEntry(s, {
        ...r,
        date,
        custom: true,
        customGroupId,
        customInput: input,
        source: "manual_physical",
        repeat: false,
        tier: state.tier,
      }),
    state,
  );
}
export function removeCustomReading(state, id) {
  return state.entries
    .filter((e) => e.customGroupId === id && !e.retracted)
    .reduce((s, e) => retractEntry(s, e.id), state);
}
export function customReadings(state, day) {
  const groups = new Map();
  for (const e of state.entries.filter(
    (e) => e.custom && !e.retracted && e.date === day,
  )) {
    if (!groups.has(e.customGroupId)) groups.set(e.customGroupId, []);
    groups.get(e.customGroupId).push(e);
  }
  return [...groups.entries()].map(([id, entries]) => {
    const input = entries[0].customInput;
    const all = input && customRanges(input);
    const intact =
      all &&
      all.length === entries.length &&
      all.every((r) =>
        entries.some(
          (e) => r.surah === e.surah && r.from === e.from && r.to === e.to,
        ),
      );
    if (input?.kind === "juz" && intact)
      return {
        id,
        name:
          input.from === input.to
            ? juzName(input.from)
            : `الأجزاء ${ar(input.from)}–${ar(input.to)}`,
        detail: "قراءة مخصّصة",
        kind: "custom",
      };
    return {
      id,
      kind: "custom",
      name: entries
        .map((e) => {
          const chapter = chapters.find((s) => s.id === e.surah);
          return `سورة ${chapter?.name}${e.from === 1 && e.to === chapter?.total_verses ? "" : ` · الآيات ${ar(e.from)}–${ar(e.to)}`}`;
        })
        .join("، "),
      detail: "قراءة مخصّصة",
    };
  });
}
export function istighfarForDay(state, day) {
  return (
    state.istighfarDays?.[day] || {
      count: 0,
      target: state.istighfarGoal || 100,
    }
  );
}
export function setIstighfar(state, day, count) {
  if (!Number.isInteger(count) || count < 0 || count > 1000000)
    throw new Error("أدخل عددًا صحيحًا من ٠ إلى ١٬٠٠٠٬٠٠٠");
  const previous = istighfarForDay(state, day);
  if (previous.count === count) return state;
  const record = {
    ...previous,
    count,
    tier: state.tier,
    revision: (previous.revision || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  return {
    ...state,
    istighfarDays: { ...state.istighfarDays, [day]: record },
    istighfarRevisions: [
      ...(state.istighfarRevisions || []),
      { day, ...previous },
    ],
  };
}

// Validate the complete submission before changing any local evidence. The app
// reconciles this single state update into one member/day community card.
export function customWirdInputs({ surahs = [], juz = [], istighfarCount }) {
  if (!Array.isArray(surahs) || !Array.isArray(juz))
    throw new Error("راجع اختيار الورد");
  const inputs = surahs.map((item) => {
    const chapter = chapters.find((s) => s.id === item.surah);
    const input = {
      kind: "surah",
      surah: item.surah,
      from: item.from ?? 1,
      to: item.to ?? chapter?.total_verses,
    };
    customRanges(input);
    return input;
  });
  for (const id of [...new Set(juz)]) {
    const input = { kind: "juz", from: id, to: id };
    customRanges(input);
    inputs.push(input);
  }
  if (
    istighfarCount !== undefined &&
    (!Number.isInteger(istighfarCount) ||
      istighfarCount < 0 ||
      istighfarCount > 1000000)
  )
    throw new Error("أدخل عددًا صحيحًا من ٠ إلى ١٬٠٠٠٬٠٠٠");
  if (!inputs.length && istighfarCount === undefined)
    throw new Error("اختر قراءة أو أدخل عدد الاستغفار");
  return inputs;
}
export function saveCustomWird(state, selection, day) {
  const inputs = customWirdInputs(selection);
  let next = inputs.reduce(
    (s, input) => addCustomReading(s, input, day),
    state,
  );
  if (selection.istighfarCount !== undefined)
    next = setIstighfar(next, day, selection.istighfarCount);
  return next;
}
