import { useRef, useState } from "react";
import { ArrowRight, ArrowLeft, BookOpen, Check } from "lucide-react";
import { useApp, ar, navigate } from "../context.jsx";
import { Button } from "../components/UI.jsx";
import { DEMO_DATE, componentStatus } from "../data/model.js";
import { wirdRows, setWirdCompletion, completedSwipe } from "../data/wird.js";
import "./Today.css";
import {
  DailyActivity,
  CustomReadingModal,
} from "../features/daily/DailyActivity.jsx";

export function WirdCapsule({ row, status, onChange, disabled = false }) {
  const done = status.status === "complete";
  const start = useRef(null),
    ignoreClick = useRef(false);
  const [drag, setDrag] = useState(null);
  const [active, setActive] = useState(false);
  const ratio = drag === null ? (done ? 1 : 0) : drag;
  function cancel() {
    start.current = null;
    setDrag(null);
    setActive(false);
  }
  function down(e) {
    if (disabled) return;
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) {
      cancel();
      return;
    }
    ignoreClick.current = false;
    start.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      travel: Math.max(80, e.currentTarget.clientWidth - 72),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x,
      dy = e.clientY - s.y;
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
      ignoreClick.current = true;
      cancel();
      return;
    }
    if (Math.abs(dx) > 8) {
      ignoreClick.current = true;
      setActive(true);
      setDrag(Math.max(0, Math.min(1, (done ? 1 : 0) + dx / s.travel)));
    }
  }
  function up(e) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x,
      dy = e.clientY - s.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) ignoreClick.current = true;
    if (completedSwipe(dx, dy, s.travel, done)) onChange(!done);
    cancel();
  }
  return (
    <button
      type="button"
      role="checkbox"
      disabled={disabled}
      aria-checked={done}
      aria-description={row.detail}
      aria-label={`${row.label || `قراءة ${row.name}`}${status.count && !done ? `، ${ar(status.count)} من ${ar(row.total)} ${row.unit || "آية"}` : ""}`}
      title={
        done
          ? "اسحب لليسار لإلغاء الإتمام، أو اضغط العلامة"
          : "اسحب لليمين للإتمام، أو اضغط السهم"
      }
      className={`wird-capsule ${done ? "done" : ""} ${active ? "dragging" : ""} ${status.count && !done ? "partial" : ""}`}
      style={{
        "--swipe": ratio,
        "--coverage": `${Math.min(100, (status.count / row.total) * 100)}%`,
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => {
        ignoreClick.current = true;
        cancel();
      }}
      onLostPointerCapture={cancel}
      onClick={(e) => {
        if (
          e.detail === 0 ||
          (!ignoreClick.current && e.target.closest(".wird-thumb"))
        )
          onChange(!done);
        ignoreClick.current = false;
      }}
    >
      <span className="wird-sweep" aria-hidden="true" />
      <span className="wird-capsule-copy">
        <span className="wird-task-label">
          {row.label || `قراءة ${row.name}`}
        </span>
        {row.detail && <span className="wird-partial-count">{row.detail}</span>}
        {status.count > 0 && !done && (
          <span className="wird-partial-count">
            {ar(status.count)} / {ar(row.total)} {row.unit || "آية"}
          </span>
        )}
      </span>
      <span className="wird-thumb" aria-hidden="true">
        {done ? (
          <Check size={23} strokeWidth={2.2} />
        ) : (
          <ArrowRight size={23} strokeWidth={1.8} />
        )}
      </span>
      {status.count > 0 && !done && (
        <span className="wird-coverage" aria-hidden="true" />
      )}
    </button>
  );
}

export function Today() {
  const { state, update, currentDay = DEMO_DATE } = useApp();
  const [custom, setCustom] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const rows = wirdRows(state);
  const ready = rows.length > 0 && state.scenario !== "error";
  const day = new Date(`${currentDay}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(
    day,
  );
  const date = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(day);
  return (
    <section className="today-focus" aria-labelledby="wird-date-title">
      <header className="wird-date-header">
        <div>
          <h1 id="wird-date-title">ورد يوم {weekday}</h1>
          <time dateTime={currentDay}>{date}</time>
        </div>
      </header>
      {ready ? (
        <div className="wird-capsules">
          {rows.map((row) => (
            <WirdCapsule
              key={row.surah}
              row={row}
              status={componentStatus(
                state.entries,
                row.surah,
                row.total,
                currentDay,
              )}
              onChange={(done) => {
                update((s) =>
                  setWirdCompletion(s, row.surah, done, currentDay),
                );
                setAnnouncement(
                  `${row.name}، ${done ? "مكتملة" : "غير مكتملة"}`,
                );
              }}
            />
          ))}
        </div>
      ) : (
        <div className="wird-unavailable" role="status">
          {state.scenario === "error" ? (
            <>
              <p>تعذّر عرض الورد</p>
              <button
                className="text-btn"
                onClick={() => update({ scenario: "normal" })}
              >
                إعادة المحاولة
              </button>
            </>
          ) : state.scenario === "free" ? (
            "لا يوجد ورد لهذا اليوم"
          ) : (
            "جدول الورد بانتظار الاعتماد"
          )}
        </div>
      )}
      <DailyActivity
        key={`activity-${currentDay}`}
        onAdd={() => setCustom(true)}
      />
      {custom && (
        <CustomReadingModal
          key={`custom-${currentDay}`}
          onClose={() => setCustom(false)}
        />
      )}
      <Button className="wird-start" onClick={() => navigate("reader")}>
        <BookOpen size={19} strokeWidth={1.7} />
        ابدأ القراءة
        <ArrowLeft size={18} />
      </Button>
      <span className="wird-sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}
