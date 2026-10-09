import { customWirdInputs } from "../data/dailyActivity.js";
import { mutation, occurrence } from "../services/connected.js";

// v0.5 has individual writes. Retain the exact UUID/body and cursor across a
// failed submission; confirmed steps are never recreated on a retry.
export function customWirdBatch(data, selection) {
  const inputs = customWirdInputs(selection);
  const at = occurrence();
  const steps = inputs.map((input) => ({
    path: "/today/custom",
    method: "POST",
    body: mutation({
      referenceVersion: data.assignment.referenceVersion,
      selection:
        input.kind === "juz"
          ? { kind: "juz", from: input.from, to: input.to }
          : {
              kind: "surah",
              surahId: input.surah,
              fromAyah: input.from,
              toAyah: input.to,
            },
      ...at,
    }),
  }));
  if (
    selection.istighfarCount !== undefined &&
    selection.istighfarCount !== data.istighfar.count
  )
    steps.push({
      path: "/today/istighfar",
      method: "PUT",
      body: mutation({
        day: data.assignmentDay,
        expectedRevision: data.istighfar.revision,
        count: selection.istighfarCount,
        ...at,
      }),
    });
  return { steps, cursor: 0 };
}
export async function continueCustomWird(batch, write) {
  while (batch.cursor < batch.steps.length) {
    const step = batch.steps[batch.cursor];
    if (!(await write(step.path, step.method, step.body)))
      throw new Error(
        batch.cursor
          ? `حُفظ ${batch.cursor} من ${batch.steps.length}. اضغط متابعة الحفظ لإكمال الباقي.`
          : "لم يكتمل الحفظ. اضغط متابعة الحفظ للمحاولة مجددًا.",
      );
    batch.cursor++;
  }
}
