import { useState } from "react";
import { chapters } from "../data/dailyActivity.js";
import { ar } from "../context.jsx";
import "./CustomCommitmentFields.css";

export const emptyCommitment = () => ({
  period: "weekly",
  selections: [],
  verseTarget: "",
});
export function CustomCommitmentFields({ value, onChange, disabled = false }) {
  const [query, setQuery] = useState("");
  const change = (patch) => onChange({ ...value, ...patch });
  const select = (chapter) =>
    change({
      selections: value.selections.some((s) => s.surahId === chapter.id)
        ? value.selections.filter((s) => s.surahId !== chapter.id)
        : [
            ...value.selections,
            { surahId: chapter.id, fromAyah: 1, toAyah: chapter.total_verses },
          ].sort((a, b) => a.surahId - b.surahId),
    });
  const range = (id, key, val) =>
    change({
      selections: value.selections.map((s) =>
        s.surahId === id ? { ...s, [key]: Number(val) } : s,
      ),
    });
  return (
    <fieldset className="custom-plan-fields" disabled={disabled}>
      <legend>ورد تختاره بنفسك</legend>
      <div className="custom-plan-period" role="group" aria-label="فترة الورد">
        {[
          ["daily", "يومي"],
          ["weekly", "أسبوعي"],
          ["monthly", "شهري"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={value.period === id}
            onClick={() => change({ period: id })}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="quiet-note">
        نوزّع الآيات على أيام الفترة تلقائيًا؛ السبت للراحة والاحتفال.
      </p>
      <label className="field">
        السور
        <input
          type="search"
          placeholder="ابحث عن سورة"
          aria-label="ابحث عن سورة لخطة الورد"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div
        className="custom-plan-grid"
        role="group"
        aria-label="اختيار سور الورد"
      >
        {chapters
          .filter((s) => s.name.includes(query.trim()))
          .map((s) => (
            <button
              type="button"
              key={s.id}
              aria-pressed={value.selections.some((x) => x.surahId === s.id)}
              onClick={() => select(s)}
            >
              <small>{ar(s.id)}</small>
              {s.name}
            </button>
          ))}
      </div>
      {value.selections.length > 0 && (
        <details className="custom-plan-ranges">
          <summary>تحديد الآيات · {ar(value.selections.length)}</summary>
          {value.selections.map((s) => {
            const chapter = chapters.find((c) => c.id === s.surahId);
            return (
              <div className="custom-plan-range" key={s.surahId}>
                <strong>{chapter.name}</strong>
                <label>
                  من آية
                  <input
                    aria-label={`بداية ${chapter.name}`}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={s.toAyah || chapter.total_verses}
                    step="1"
                    required
                    value={s.fromAyah || ""}
                    onChange={(e) =>
                      range(s.surahId, "fromAyah", e.target.value)
                    }
                  />
                </label>
                <label>
                  إلى آية
                  <input
                    aria-label={`نهاية ${chapter.name}`}
                    type="number"
                    inputMode="numeric"
                    min={s.fromAyah || 1}
                    max={chapter.total_verses}
                    step="1"
                    required
                    value={s.toAyah || ""}
                    onChange={(e) => range(s.surahId, "toAyah", e.target.value)}
                  />
                </label>
              </div>
            );
          })}
        </details>
      )}
      <label className="field">
        هدف الآيات خلال الفترة <small>اختياري · ضمن السور المختارة</small>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          max={
            value.selections.reduce(
              (n, s) => n + Math.max(0, s.toAyah - s.fromAyah + 1),
              0,
            ) || 6236
          }
          step="1"
          placeholder="كل الآيات المختارة"
          value={value.verseTarget}
          onChange={(e) => change({ verseTarget: e.target.value })}
        />
      </label>
    </fieldset>
  );
}
