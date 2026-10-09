import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useApp, ar } from "../../context.jsx";
import { Button, Modal } from "../../components/UI.jsx";
import { WirdCapsule } from "../../pages/Today.jsx";
import { componentStatus } from "../../data/model.js";
import { wirdRows } from "../../data/wird.js";
import {
  chapters,
  customWirdInputs,
  saveCustomWird,
  customReadings,
  removeCustomReading,
  istighfarForDay,
  setIstighfar,
} from "../../data/dailyActivity.js";
export function CustomReadingModal({
  onClose,
  currentCount,
  onSave,
  maxCount = 1000000,
  externalError = "",
}) {
  const { state, update, currentDay, notify } = useApp();
  const daily = istighfarForDay(state, currentDay);
  const initialCount = onSave ? currentCount : daily.count;
  const [saving, setSaving] = useState(false),
    [locked, setLocked] = useState(false);
  const [kind, setKind] = useState("surah");
  const [surahs, setSurahs] = useState({}),
    [juz, setJuz] = useState([]);
  const [count, setCount] = useState(initialCount ? String(initialCount) : ""),
    [error, setError] = useState("");
  const selected = Object.keys(surahs).length + juz.length;
  function toggleSurah(chapter) {
    setSurahs((previous) => {
      const next = { ...previous };
      if (next[chapter.id]) delete next[chapter.id];
      else
        next[chapter.id] = {
          surah: chapter.id,
          from: 1,
          to: chapter.total_verses,
        };
      return next;
    });
  }
  return (
    <Modal
      title="إضافة ورد مخصّص"
      closeDisabled={saving}
      onClose={() => !saving && onClose()}
    >
      <form
        className="custom-wird-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const selection = {
            surahs: Object.values(surahs).map((s) => ({
              ...s,
              from: Number(s.from),
              to: Number(s.to),
            })),
            juz,
            istighfarCount: count.trim() === "" ? undefined : Number(count),
          };
          try {
            customWirdInputs(selection);
            setSaving(true);
            setError("");
            if (onSave) {
              setLocked(true);
              await onSave(selection);
            } else update((s) => saveCustomWird(s, selection, currentDay));
            notify("حُفظ وردك وتحدّثت مشاركتك في المجتمع.");
            onClose();
          } catch (err) {
            setError(err.message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <fieldset className="custom-wird-fields" disabled={saving || locked}>
          <div className="custom-kind" role="group" aria-label="نوع القراءة">
            {[
              ["surah", "السور"],
              ["juz", "الأجزاء"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={kind === id}
                onClick={() => setKind(id)}
              >
                {label}
                <span>
                  {ar(id === "surah" ? Object.keys(surahs).length : juz.length)}
                </span>
              </button>
            ))}
          </div>
          <div
            className={`custom-choice-grid ${kind === "juz" ? "juz-choices" : ""}`}
            role="group"
            aria-label={
              kind === "surah"
                ? "اختر السور التي قرأتها"
                : "اختر الأجزاء التي قرأتها"
            }
          >
            {kind === "surah"
              ? chapters.map((s) => (
                  <label key={s.id} className={surahs[s.id] ? "selected" : ""}>
                    <input
                      type="checkbox"
                      checked={!!surahs[s.id]}
                      onChange={() => toggleSurah(s)}
                    />
                    <span className="choice-number" aria-hidden="true">
                      {ar(s.id)}
                    </span>
                    <span>{s.name}</span>
                    <Check
                      className="choice-check"
                      size={16}
                      aria-hidden="true"
                    />
                  </label>
                ))
              : Array.from({ length: 30 }, (_, i) => i + 1).map((id) => (
                  <label
                    key={id}
                    className={juz.includes(id) ? "selected" : ""}
                  >
                    <input
                      type="checkbox"
                      aria-label={`الجزء ${ar(id)}`}
                      checked={juz.includes(id)}
                      onChange={() =>
                        setJuz((old) =>
                          old.includes(id)
                            ? old.filter((n) => n !== id)
                            : [...old, id],
                        )
                      }
                    />
                    <span>{ar(id)}</span>
                    <Check
                      className="choice-check"
                      size={14}
                      aria-hidden="true"
                    />
                  </label>
                ))}
          </div>
          <label className="field custom-istighfar">
            الاستغفار
            <span className="istighfar-number-field">
              <input
                aria-label="عدد الاستغفار اليوم"
                type="number"
                inputMode="numeric"
                min="0"
                max={maxCount}
                step="1"
                placeholder="٠"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <span aria-hidden="true">مرة</span>
            </span>
          </label>
        </fieldset>
        {error && (
          <p className="wird-form-error" role="alert">
            {error}
            {externalError && ` ${externalError}`}
          </p>
        )}
        <Button
          type="submit"
          className="custom-wird-submit"
          disabled={
            saving ||
            (!locked &&
              !selected &&
              (count.trim() === "" || Number(count) === initialCount))
          }
        >
          {saving ? "جارٍ الحفظ…" : locked ? "متابعة الحفظ" : "حفظ الورد"}
        </Button>
      </form>
    </Modal>
  );
}
export function DailyActivity({ onAdd }) {
  const { state, update, currentDay, notify } = useApp();
  const daily = istighfarForDay(state, currentDay);
  const completedAssigned = wirdRows(state).filter(
    (r) =>
      componentStatus(state.entries, r.surah, r.total, currentDay).status ===
      "complete",
  );
  const custom = customReadings(state, currentDay).filter(
    (r) =>
      !state.entries
        .filter((e) => !e.retracted && e.customGroupId === r.id)
        .every((e) => completedAssigned.some((a) => a.surah === e.surah)),
  );
  return (
    <div className="daily-activity">
      <div className="wird-capsules">
        <WirdCapsule
          row={{
            label: `استغفار ${ar(Math.max(daily.count, daily.target))} مرة`,
            total: daily.target,
            unit: "مرة",
          }}
          status={{
            count: daily.count,
            status:
              daily.count >= daily.target
                ? "complete"
                : daily.count
                  ? "partial"
                  : "no_entry",
          }}
          onChange={(done) =>
            update((s) => setIstighfar(s, currentDay, done ? daily.target : 0))
          }
        />
        {custom.map((r) => (
          <WirdCapsule
            key={r.id}
            row={{ label: r.name, total: 1 }}
            status={{ count: 1, status: "complete" }}
            onChange={() => {
              update((s) => removeCustomReading(s, r.id));
              notify("أُزيل هذا الورد وتحدّثت مشاركتك.");
            }}
          />
        ))}
      </div>
      <div className="daily-secondary">
        <button className="wird-add" onClick={onAdd}>
          <Plus size={16} />
          إضافة ورد مخصّص
        </button>
      </div>
    </div>
  );
}
