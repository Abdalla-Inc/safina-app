export const calendarStates = {
  complete: { label: "مكتمل", mark: "✓" },
  partial: { label: "قراءة جزئية", mark: "◐" },
  missed: { label: "لم يكتمل", mark: "−" },
  open: { label: "اليوم لم ينتهِ", mark: "○" },
  rest: { label: "راحة", mark: "—" },
  future: { label: "يوم قادم", mark: "" },
  unknown: { label: "بانتظار التقييم", mark: "·" },
  unassigned: { label: "قبل بدء الورد", mark: "" },
};
export function calendarState(day, today) {
  if (day.date > today) return "future";
  if (day.historicalLevels?.length === 0 || day.status === "not_assigned")
    return "unassigned";
  if (["complete", "completed"].includes(day.status)) return "complete";
  if (day.status === "partial") return "partial";
  if (["free", "free_day", "paused"].includes(day.status)) return "rest";
  if (day.status === "no_entry") return day.date === today ? "open" : "missed";
  return "unknown";
}
export function monthStats(days, today) {
  const sorted = [...days]
    .filter((d) => d.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  let run = 0;
  for (const day of sorted) {
    const state = calendarState(day, today);
    if (state === "complete") run++;
    else if (
      state === "rest" ||
      (day.date === today && ["open", "partial"].includes(state))
    )
      continue;
    else break;
  }
  return {
    complete: sorted.filter((d) => calendarState(d, today) === "complete")
      .length,
    streak: run,
  };
}
export function moveMonth(month, delta) {
  const [year, n] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, n - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}
export function monthDays(month) {
  const [year, n] = month.split("-").map(Number);
  return new Date(Date.UTC(year, n, 0)).getUTCDate();
}
