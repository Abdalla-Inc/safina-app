import { demoEvaluation } from "../../data/model.js";

// Demo-only projection. No starter credit, no extra step for repeated reports,
// and no invented BJ schedule. Production uses /ship-visual-state.
export function localBuildProgress(state, throughDay) {
  const entries = state.entries.filter(
    (e) => !e.retracted && e.date <= throughDay,
  );
  const days = [...new Set(entries.map((e) => e.date))];
  return Math.min(
    30,
    days.filter((day) => {
      const levels = [
        ...new Set(
          entries.filter((e) => e.date === day && !e.custom).map((e) => e.tier),
        ),
      ];
      const tier =
        day === throughDay
          ? state.tier
          : levels.length === 1
            ? levels[0]
            : null;
      return (
        demoEvaluation({ ...state, tier, scenario: "normal" }, day).credit === 1
      );
    }).length,
  );
}
