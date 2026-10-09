// Condition is a reversible art control, independent of earned construction.
const sailLossThresholds = [28, 45, 0, 55, 36, 64, 42, 58, 38, 50];
export function sailSurvives(index, condition) {
  return (
    condition > sailLossThresholds[index % sailLossThresholds.length] ||
    index === 2
  );
}
export function hullBreach(condition) {
  return Math.max(0, Math.min(1, (78 - condition) / 66));
}
