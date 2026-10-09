import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  Feather,
  Plus,
  Minus,
  Trash2,
  Share2,
} from "lucide-react";
import { useApp, ar, navigate } from "../context.jsx";
import { Button, IconButton, Modal } from "../components/UI.jsx";

import {
  DEMO_DATE,
  upsertEntry,
  retractEntry,
  validateRange,
  undoReadingMutation,
} from "../data/model.js";

export function EntryRow({ entry: e }) {
  const { state, update, setModal, notify, quran } = useApp();
  return (
    <div className="entry-row">
      <span className="entry-icon">
        <Check size={17} />
      </span>
      <button
        className="entry-main"
        onClick={() => setModal({ type: "log", surah: e.surah, edit: e })}
      >
        <strong>
          {quran.find((s) => s.id === e.surah)?.name || `سورة ${ar(e.surah)}`} ·{" "}
          {ar(e.from)}–{ar(e.to)}
        </strong>
        <small>
          {e.repeat ? "تكرار مستقل · " : ""}
          {e.source === "reader_confirmed"
            ? "قراءة أكّدتها من التطبيق"
            : "تسجيل يدوي"}
          {state.scenario === "offline" ? " · محلي دون اتصال" : ""}
        </small>
      </button>

      <IconButton
        label="تصحيح القراءة"
        onClick={() => setModal({ type: "log", surah: e.surah, edit: e })}
      >
        <Edit3 size={17} />
      </IconButton>
    </div>
  );
}
export function LogModal({ data, onClose }) {
  const { state, update, notify, quran, currentDay = DEMO_DATE } = useApp();
  const original = data.edit;
  const [surah, setSurah] = useState(original?.surah || data.surah || 2);
  const [from, setFrom] = useState(original?.from || data.trace?.from || 1);
  const [to, setTo] = useState(original?.to || data.trace?.to || 1);
  const [date, setDate] = useState(original?.date || data.date || currentDay);
  const [repeat, setRepeat] = useState(original?.repeat || false);
  const [error, setError] = useState("");
  const s = quran.find((x) => x.id === Number(surah));
  const max = s?.total_verses || 286;
  const save = (e) => {
    e.preventDefault();
    if (!validateRange(surah, from, to, quran)) {
      setError("راجع البداية والنهاية: اختر نطاقًا صحيحًا من آيات السورة.");
      return;
    }
    if (date > currentDay || date < "2026-01-01") {
      setError("اختر تاريخًا بين بداية ٢٠٢٦ واليوم.");
      return;
    }
    const duplicate =
      !original &&
      state.entries.some(
        (x) =>
          !x.retracted &&
          x.date === date &&
          x.surah === Number(surah) &&
          x.from === Number(from) &&
          x.to === Number(to) &&
          !repeat,
      );
    if (duplicate) {
      setError(
        "هذه القراءة مسجّلة بالفعل. عدّل سجلّها، أو اختر تكرارًا مستقلًا إن قرأت مرة أخرى.",
      );
      return;
    }
    const previous = state;
    const entryId = original?.id || crypto.randomUUID();
    update((st) => {
      const next = upsertEntry(st, {
        ...original,
        id: entryId,
        surah: Number(surah),
        from: Number(from),
        to: Number(to),
        date,
        tier: original?.tier || state.tier,
        repeat,
        source: data.trace
          ? "reader_confirmed"
          : original?.source || "manual_physical",
      });
      return { ...next, trace: data.trace ? null : st.trace };
    });
    notify(
      original
        ? "صُحّح السجلّ. أُزيلت مشاركته القديمة إن وُجدت."
        : "حُفظت قراءتك على هذا الجهاز.",
      () => update((s) => undoReadingMutation(s, previous, entryId)),
    );
    onClose();
  };
  return (
    <Modal
      title={
        original
          ? "تصحيح قراءتك"
          : data.trace
            ? "راجع ما قرأته فعلًا"
            : "سجّل ما قرأت"
      }
      onClose={onClose}
    >
      <form onSubmit={save}>
        {data.trace ? (
          <div className="info-box">
            اقتراح من التنقّل في المصحف، وليس إثباتًا للقراءة. قصّر النطاق أو
            مدّده قبل التأكيد.
          </div>
        ) : (
          <p className="modal-description">
            قراءة من المصحف أو من أي مصدر آخر. سجّل قدر ما قرأت، ويمكنك العودة
            لإكماله.
          </p>
        )}
        <label className="field">
          السورة
          <select
            value={surah}
            onChange={(e) => {
              setSurah(Number(e.target.value));
              setFrom(1);
              setTo(1);
            }}
          >
            {quran.length ? (
              quran.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))
            ) : (
              <option value="2">البقرة</option>
            )}
          </select>
        </label>
        <div className="form-grid">
          <label className="field">
            من الآية
            <input
              type="number"
              min="1"
              max={max}
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="field">
            إلى الآية
            <input
              type="number"
              min="1"
              max={max}
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <div className="range-control">
          <span>
            موضع التوقّف{" "}
            <strong>
              {ar(Number(to) || 1)} / {ar(max)}
            </strong>
          </span>
          <div>
            <IconButton
              label="الآية السابقة"
              type="button"
              onClick={() =>
                setTo((n) => Math.max(Number(from) || 1, Number(n) - 1))
              }
            >
              <Minus size={18} />
            </IconButton>
            <input
              aria-label="موضع التوقف في السورة"
              type="range"
              min={Number(from) || 1}
              max={max}
              value={to}
              onChange={(e) => {
                setTo(Number(e.target.value));
                if (navigator.vibrate) navigator.vibrate(5);
              }}
            />
            <IconButton
              label="الآية التالية"
              type="button"
              onClick={() => setTo((n) => Math.min(max, Number(n) + 1))}
            >
              <Plus size={18} />
            </IconButton>
          </div>
        </div>
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            setFrom(1);
            setTo(max);
          }}
        >
          <CheckCircle2 size={17} />
          قرأت السورة كاملة
        </button>
        <label className="field">
          تاريخ القراءة
          <input
            type="date"
            min="2026-01-01"
            max={currentDay}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
          />
          هذه قراءة جديدة مكرّرة، وليست استكمالًا
        </label>
        <p className="caption">
          تُحفظ الآيات المتداخلة دون مضاعفة التغطية. السجلّ الخاص لا يُنشر في
          الحلقة.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <Button type="submit">
            <Check size={18} />
            {original ? "حفظ التصحيح" : "أؤكّد القراءة وأحفظ"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
        </div>
        {(original || data.trace) && (
          <button
            className="text-btn danger delete-entry"
            type="button"
            onClick={() => {
              const previous = state;
              update((st) =>
                original
                  ? retractEntry(st, original.id)
                  : { ...st, trace: null },
              );
              notify(
                original
                  ? "أُلغي السجلّ ومشاركته المرتبطة."
                  : "تُرك الاقتراح دون تسجيل.",
                () =>
                  update((s) =>
                    original
                      ? undoReadingMutation(s, previous, original.id)
                      : { ...s, trace: previous.trace },
                  ),
              );
              onClose();
            }}
          >
            <Trash2 size={16} />
            {original ? "إلغاء هذا السجلّ" : "تجاهل الاقتراح"}
          </button>
        )}
      </form>
    </Modal>
  );
}
export function ShareModal({ data, onClose }) {
  const { state, update, notify, quran, currentDay = DEMO_DATE } = useApp();
  const [group, setGroup] = useState(state.groups[0]?.id || "");
  const [details, setDetails] = useState(false);
  const [consent, setConsent] = useState(false);
  const e = data.entry;
  const text = details
    ? `سجّلت قراءة ${quran.find((s) => s.id === e.surah)?.name}، الآيات ${ar(e.from)}–${ar(e.to)}.`
    : "سجّلت قراءتي اليوم. سعيد بهذه الخطوة الصغيرة.";
  return (
    <Modal title="مشاركة باختيارك" onClose={onClose}>
      {state.groups.length ? (
        <>
          <p className="modal-description">
            هذه معاينة داخل النسخة فقط. لا تُرسل إلى أشخاص حقيقيين.
          </p>
          <label className="field">
            من يرى التحديث؟
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              {state.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={details}
              onChange={(e) => setDetails(e.target.checked)}
            />
            ضمّن اسم السورة والآيات
          </label>
          <div className="post-preview">
            <span>معاينة التحديث</span>
            <p>{text}</p>
          </div>
          <label className="check-field">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            أوافق على مشاركة هذا التحديث في الحلقة المحدّدة
          </label>
          <p className="caption">
            مشاركة واحدة. يمكنك حذفها. التصحيح أو إلغاء القراءة يزيل التحديث
            المرتبط من التجربة.
          </p>
          <Button
            disabled={!consent}
            onClick={() => {
              update((st) => ({
                ...st,
                posts: [
                  ...st.posts.filter((p) => p.entryId !== e.id),
                  {
                    id: crypto.randomUUID(),
                    entryId: e.id,
                    groupId: group,
                    text,
                    detail: details,
                    at: new Date().toISOString(),
                  },
                ],
              }));
              notify("أُضيف التحديث إلى حلقتك التجريبية.");
              onClose();
            }}
          >
            <Share2 size={17} />
            مشاركة في التجربة
          </Button>
        </>
      ) : (
        <Empty
          icon={Share2}
          title="انضم إلى حلقة أولًا"
          action={
            <Button
              onClick={() => {
                onClose();
                navigate("circles");
              }}
            >
              استكشف الحلقات
            </Button>
          }
        >
          سيظل سجلّك خاصًا حتى تختار مشاركته.
        </Empty>
      )}
    </Modal>
  );
}
