import {
  DEMO_DATE,
  componentStatus,
  upsertEntry,
  retractEntry,
} from "./model.js";

export function wirdRows(state) {
  if (
    ["free", "policy", "error"].includes(state.scenario) ||
    !["B", "BI"].includes(state.tier)
  )
    return [];
  const rows = [{ surah: 2, name: "سورة البقرة", total: 286 }];
  if (state.tier === "BI")
    rows.push({ surah: 3, name: "سورة آل عمران", total: 200 });
  return rows;
}

export function setWirdCompletion(state, surah, complete, date = DEMO_DATE) {
  const row = wirdRows(state).find((r) => r.surah === surah);
  if (!row) return state;
  const status = componentStatus(state.entries, surah, row.total, date);
  if (complete) {
    if (status.status === "complete") return state;
    return upsertEntry(state, {
      surah,
      from: 1,
      to: row.total,
      date,
      source: "manual_physical",
      repeat: false,
      tier: state.tier,
    });
  }
  // Remove full reports first so earlier partial reading survives reopening.
  const active = state.entries.filter(
    (e) => !e.retracted && e.date === date && e.surah === surah,
  );
  const full = active.filter((e) => e.from === 1 && e.to === row.total);
  let next = full.reduce((s, entry) => retractEntry(s, entry.id), state);
  // If several partial acts independently complete the whole task, reopening
  // retracts those acts too. History is retained; other days/tasks are untouched.
  if (
    !full.length ||
    componentStatus(next.entries, surah, row.total, date).status === "complete"
  ) {
    next = active
      .filter((e) => !full.some((f) => f.id === e.id))
      .reduce((s, entry) => retractEntry(s, entry.id), next);
  }
  return next;
}

export function addWirdPartial(state, surah, from, to, date = DEMO_DATE) {
  const row = wirdRows(state).find((r) => r.surah === surah);
  if (
    !row ||
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 1 ||
    to < from ||
    to > row.total
  )
    return state;
  const covered = new Set();
  state.entries
    .filter((e) => !e.retracted && e.date === date && e.surah === surah)
    .forEach((e) => {
      for (let n = e.from; n <= e.to; n++) covered.add(n);
    });
  if (
    Array.from({ length: to - from + 1 }, (_, i) => from + i).every((n) =>
      covered.has(n),
    )
  )
    return state;
  return upsertEntry(state, {
    surah,
    from,
    to,
    date,
    source: "manual_physical",
    repeat: false,
    tier: state.tier,
  });
}

export function completedSwipe(dx, dy, travel, complete) {
  const distance = complete ? -dx : dx;
  return (
    distance >= Math.max(56, travel * 0.62) && distance > Math.abs(dy) * 1.5
  );
}
