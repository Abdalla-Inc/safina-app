import { ChevronLeft, ChevronRight, Flame, Check } from "lucide-react";
import { ar } from "../../context.jsx";
import {
  calendarStates,
  calendarState,
  monthStats,
  moveMonth,
  monthDays,
} from "./calendar.js";
import "./safina.css";
export function JourneyCalendar({
  month,
  today,
  days,
  selected,
  onSelect,
  onMonth,
  demo = false,
}) {
  const count = monthDays(month),
    first = new Date(`${month}-01T12:00:00Z`).getUTCDay();
  const rows = Array.from({ length: count }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    return days.find((d) => d.date === date) || { date, status: "unknown" };
  });
  const stats = monthStats(rows, today);
  const title = new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Riyadh",
  }).format(new Date(`${month}-01T12:00:00Z`));
  return (
    <section className="safina-calendar" aria-label="تقويم الالتزام">
      <header>
        <h2>{title}</h2>
        <div>
          <button
            onClick={() => onMonth(moveMonth(month, -1))}
            aria-label="الشهر السابق"
          >
            <ChevronRight size={19} />
          </button>
          <button
            onClick={() => onMonth(moveMonth(month, 1))}
            disabled={month >= today.slice(0, 7)}
            aria-label="الشهر التالي"
          >
            <ChevronLeft size={19} />
          </button>
        </div>
      </header>
      <div className="safina-month-stats">
        <span>
          <Check size={16} />
          <strong>{ar(stats.complete)}</strong> أيام مكتملة
        </span>
        <span>
          <Flame size={17} />
          <strong>{ar(stats.streak)}</strong> تتابع هذا الشهر
        </span>
      </div>
      <div className="safina-calendar-grid">
        {["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"].map(
          (d) => (
            <span className="safina-weekday" key={d}>
              {d}
            </span>
          ),
        )}
        {Array.from({ length: first }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {rows.map((day, i) => {
          const tone = calendarState(day, today),
            status = calendarStates[tone];
          return (
            <button
              key={day.date}
              className={`safina-day ${tone} ${selected === i + 1 ? "selected" : ""}`}
              aria-label={`${ar(i + 1)} ${title}، ${status.label}`}
              aria-pressed={selected === i + 1}
              aria-current={day.date === today ? "date" : undefined}
              onClick={() => onSelect(i + 1)}
            >
              <span>{ar(i + 1)}</span>
              <small aria-hidden="true">{status.mark}</small>
            </button>
          );
        })}
      </div>
      <div className="safina-calendar-legend">
        {["complete", "partial", "missed", "rest"].map((s) => (
          <span key={s}>
            <i className={s} />
            {calendarStates[s].label}
          </span>
        ))}
      </div>
      {demo && (
        <small className="safina-calendar-note">
          أمثلة للعرض · الألوان تعبّر عن الإنجاز، لجميع المستويات
        </small>
      )}
    </section>
  );
}
