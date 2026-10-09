import { chapters } from "../data/dailyActivity.js";
export function customCommitmentPayload(draft) {
  if (!["daily", "weekly", "monthly"].includes(draft?.period))
    throw new Error("اختر فترة الورد.");
  if (!draft.selections?.length) throw new Error("اختر سورة واحدة على الأقل.");
  const seen = new Set();
  let total = 0;
  const selections = draft.selections.map((s) => {
    const chapter = chapters.find((c) => c.id === s.surahId);
    if (
      !chapter ||
      seen.has(s.surahId) ||
      !Number.isInteger(s.fromAyah) ||
      !Number.isInteger(s.toAyah) ||
      s.fromAyah < 1 ||
      s.toAyah < s.fromAyah ||
      s.toAyah > chapter.total_verses
    )
      throw new Error("راجع بداية ونهاية الآيات المختارة.");
    seen.add(s.surahId);
    total += s.toAyah - s.fromAyah + 1;
    return { surahId: s.surahId, fromAyah: s.fromAyah, toAyah: s.toAyah };
  });
  const target =
    draft.verseTarget === "" || draft.verseTarget === undefined
      ? undefined
      : Number(draft.verseTarget);
  if (
    target !== undefined &&
    (!Number.isInteger(target) || target < 1 || target > total)
  )
    throw new Error("هدف الآيات يجب أن يكون ضمن الآيات المختارة.");
  return {
    period: draft.period,
    selections,
    ...(target !== undefined ? { verseTarget: target } : {}),
  };
}
