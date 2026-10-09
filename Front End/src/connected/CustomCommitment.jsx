import { chapters } from "../data/dailyActivity.js";
import { useState, useRef } from "react";
import {
  CustomCommitmentFields,
  emptyCommitment,
} from "../components/CustomCommitmentFields.jsx";
import { Button } from "../components/UI.jsx";
import { customCommitmentPayload } from "./customCommitment.js";
import { request, mutation } from "../services/connected.js";
import { ar } from "../context.jsx";

export function CustomCommitmentSettings({ me, onSaved }) {
  const current = me.commitment?.effective;
  const pending = me.commitment?.pending?.find((c) => c.tier === "CUSTOM");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({
    ...emptyCommitment(),
    ...(pending?.customWird || current?.customWird || {}),
  }));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const retry = useRef(null);
  return (
    <section className="connected-card">
      <h2>وردك الخاص</h2>
      <p>
        {pending
          ? "ورد مخصّص مجدول للبدء غدًا."
          : current?.tier === "CUSTOM"
            ? "خطتك المخصّصة موزّعة على أيام القراءة."
            : "اختر سورك وآياتك بدلًا من أحد المستويات."}
      </p>
      {!open ? (
        <Button
          variant="secondary"
          disabled={!!pending}
          onClick={() => setOpen(true)}
        >
          {current?.tier === "CUSTOM" ? "تعديل خطتي" : "إنشاء ورد مخصّص"}
        </Button>
      ) : (
        <form
          className="connected-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setMessage("");
            setBusy(true);
            try {
              if (!retry.current)
                retry.current = mutation({
                  expectedCommitmentId: current.id,
                  customWird: customCommitmentPayload(draft),
                });
              await request("/me/custom-wird", {
                method: "PUT",
                body: retry.current,
              });
              retry.current = null;
              setOpen(false);
              setMessage("حُفظ الورد الجديد ويبدأ غدًا بتوقيت مكة.");
              await onSaved();
            } catch (e) {
              if (e.status && e.status !== 0 && e.status < 500)
                retry.current = null;
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <CustomCommitmentFields
            value={draft}
            disabled={busy || !!retry.current}
            onChange={setDraft}
          />
          <p className="quiet-note">
            يبدأ التغيير غدًا؛ يبقى سجلّك السابق محفوظًا.
          </p>
          <Button disabled={busy}>
            {busy
              ? "جارٍ الحفظ…"
              : retry.current
                ? "إعادة محاولة الحفظ"
                : "حفظ الورد"}
          </Button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
export function CustomCommitmentProgress({ value, dailyRanges = [] }) {
  if (!value) return null;
  const label = {
    daily: "الورد اليومي",
    weekly: "الورد الأسبوعي",
    monthly: "الورد الشهري",
  }[value.period];
  return (
    <section className="custom-plan-progress" aria-label="تقدّم الورد المخصّص">
      <header>
        <h2>{label}</h2>
        <span>
          {ar(value.coveredVerseCount)} / {ar(value.targetVerseCount)} آية
        </span>
      </header>
      <p>
        {value.periodStart} — {value.periodEnd}
      </p>
      {dailyRanges.length > 0 && (
        <details className="custom-plan-ranges">
          <summary>آيات اليوم · {ar(value.dailyTargetVerseCount)} آية</summary>
          <ul>
            {dailyRanges.flatMap((range) => {
              const [fromSurah, fromAyah] = range.start.split(":").map(Number),
                [toSurah, toAyah] = range.end.split(":").map(Number);
              return chapters
                .filter((c) => c.id >= fromSurah && c.id <= toSurah)
                .map((c) => (
                  <li key={`${range.start}-${c.id}`}>
                    سورة {c.name} · الآيات{" "}
                    {ar(c.id === fromSurah ? fromAyah : 1)}–
                    {ar(c.id === toSurah ? toAyah : c.total_verses)}
                  </li>
                ));
            })}
          </ul>
        </details>
      )}
      <progress
        aria-label="إكمال خطة الورد"
        max={Math.max(1, value.targetVerseCount)}
        value={Math.min(value.coveredVerseCount, value.targetVerseCount)}
      />
    </section>
  );
}
