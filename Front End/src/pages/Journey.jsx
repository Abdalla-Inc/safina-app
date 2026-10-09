import { localBuildProgress } from "../features/safina/localBuildProgress.js";
import { useState, useEffect } from "react";
import {
  Check,
  Minus,
  Plus,
  RotateCcw,
  Edit3,
  CalendarDays,
  Feather,
  Info,
  Bookmark,
} from "lucide-react";
import { useApp, ar } from "../context.jsx";
import {
  Button,
  Heading,
  IconButton,
  Modal,
  Pill,
  Empty,
} from "../components/UI.jsx";
import { loadJourney, backendReadingStatus } from "../services/backend.js";
import { ShipScene } from "../features/safina/ShipScene.jsx";
import { JourneyCalendar } from "../features/safina/JourneyCalendar.jsx";
import { DEMO_DATE, demoEvaluation } from "../data/model.js";
import { EntryRow } from "./Practice.jsx";
const historyStatuses = {
  1: "complete",
  2: "complete",
  3: "partial",
  4: "complete",
  5: "complete",
  7: "complete",
  8: "complete",
  9: "complete",
  10: "complete",
  11: "complete",
  12: "paused",
  13: "paused",
  14: "complete",
  15: "complete",
  16: "partial",
  17: "complete",
  18: "complete",
  19: "complete",
  21: "complete",
  22: "complete",
  24: "complete",
  26: "complete",
};
const statusLabels = {
  recorded: "قراءة مسجّلة · التقييم غير متصل",
  complete: "قراءة مكتملة",
  partial: "قراءة جزئية",
  no_entry: "لا يوجد تسجيل",
  paused: "توقّف مخطّط",
  free: "يوم حرّ",
  supplemental: "قراءة إضافية",
};
export function Journey() {
  const { state, update, setModal, quran, currentDay = DEMO_DATE } = useApp();
  const [month, setMonth] = useState(currentDay.slice(0, 7));
  const [selected, setSelected] = useState(Number(currentDay.slice(8)));
  const [tab, setTab] = useState("calendar");
  const [info, setInfo] = useState(false);
  const [buildStep, setBuildStep] = useState(12);
  const [shipPreview, setShipPreview] = useState("full");
  const [remote, setRemote] = useState({ status: "idle", data: null });
  const [refresh, setRefresh] = useState(0);
  const live = state.journeySource === "backend";
  useEffect(() => {
    if (!live) {
      setRemote({ status: "idle", data: null });
      return;
    }
    const controller = new AbortController();
    setRemote({ status: "loading", data: null });
    loadJourney(month, controller.signal)
      .then((data) => setRemote({ status: "ready", data }))
      .catch((error) => {
        if (!controller.signal.aborted)
          setRemote({ status: "error", data: null, error: error.message });
      });
    return () => controller.abort();
  }, [live, month, refresh]);
  const data = remote.data;
  const evaluation = demoEvaluation(state, currentDay);
  const credits = live
    ? data?.ship.approvedCredits
    : localBuildProgress(state, currentDay);
  const date = `${month}-${String(selected).padStart(2, "0")}`;
  const [year, number] = month.split("-").map(Number);
  const days = new Date(year, number, 0).getDate();
  const label = new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, number - 1, 1));
  const entries = state.entries.filter((e) => !e.retracted && e.date === date);
  const remoteDay = data?.calendar.days.find((d) => d.date === date);
  const confirmedKhatmas =
    data?.khatmas.cycles.filter((c) => c.proofHash && c.completionDate) || [];
  const dayLabels = {
    ...statusLabels,
    awaiting_policy: "بانتظار التقييم",
    recorded_awaiting_policy: "قراءة مسجّلة",
    free_day: "يوم حرّ",
    no_entry: "دون تسجيل",
    unknown: "حالة غير معروفة",
  };
  function statusFor(day) {
    const d = `${month}-${String(day).padStart(2, "0")}`;
    if (d > currentDay) return "future";
    if (live)
      return backendReadingStatus(
        data?.calendar.days.find((x) => x.date === d)?.status,
      );
    if (d === currentDay) return evaluation.status;
    const records = state.entries.filter((e) => e.date === d);
    if (records.length) {
      const active = records.filter((e) => !e.retracted);
      if (!active.length) return "no_entry";
      const levels = [...new Set(active.map((e) => e.tier))];
      return levels.length === 1 && ["B", "BI"].includes(levels[0])
        ? demoEvaluation({ ...state, scenario: "normal", tier: levels[0] }, d)
            .status
        : "recorded";
    }
    return month === "2026-09"
      ? historyStatuses[day] || "no_entry"
      : "no_entry";
  }
  function ranges(rows) {
    return rows?.map((r, i) => {
      const [sid, a] = r.start.split(":").map(Number),
        [eid, z] = r.end.split(":").map(Number);
      return (
        <div className="server-range" key={i}>
          <BookRangeIcon />
          <span>
            {quran.find((s) => s.id === sid)?.name || ar(sid)} {ar(a)} —{" "}
            {sid !== eid
              ? (quran.find((s) => s.id === eid)?.name || ar(eid)) + " "
              : ""}
            {ar(z)}
          </span>
        </div>
      );
    });
  }
  return (
    <section className="simple-journey">
      <div className="journey-topline">
        <h1>رحلتي</h1>
        <div className="journey-source">
          <select
            aria-label="مصدر سجل الرحلة"
            value={live ? "backend" : "prototype"}
            onChange={(e) => update({ journeySource: e.target.value })}
          >
            <option value="prototype">عرض تجريبي</option>
            <option value="backend">الخادم · BJ2 تجريبي</option>
          </select>
          <IconButton label="عن سجل الرحلة" onClick={() => setInfo(true)}>
            <Info size={18} />
          </IconButton>
        </div>
      </div>
      {live && ["idle", "loading"].includes(remote.status) ? (
        <div className="journey-connection-state" role="status">
          جارٍ تحميل سجل الخادم…
        </div>
      ) : live && remote.status === "error" ? (
        <div className="journey-connection-state" role="alert">
          <p>تعذّر الاتصال بالخادم المحلي.</p>
          <Button variant="secondary" onClick={() => setRefresh((n) => n + 1)}>
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <>
          {!live && (
            <div className="safina-preview-select">
              <select
                aria-label="معاينة حالة السفينة"
                value={shipPreview}
                onChange={(e) => setShipPreview(e.target.value)}
              >
                <option value="full">مكتملة · حالة ١٠٠٪</option>
                <option value="records">بناء من السجل التجريبي</option>
                <option value="empty">البداية · بحر فارغ</option>
                <option value="build">معاينة مراحل البناء</option>
                <option value="wear">الصيانة · ٩١٪</option>
                <option value="repair">بعد الإصلاح · ٩٤٪</option>
                <option value="storm">عاصفة · ١٥٪</option>
                <option value="zero">حالة ٠٪</option>
              </select>
              {shipPreview === "build" && (
                <label className="ship-stage-preview">
                  المرحلة {ar(buildStep)} / {ar(30)}
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={buildStep}
                    aria-label="مرحلة بناء السفينة"
                    onChange={(e) => setBuildStep(Number(e.target.value))}
                  />
                </label>
              )}
            </div>
          )}
          <ShipScene
            reducedMotion={state.reducedMotion}
            preview={!live}
            weather={shipPreview === "storm" ? "rough" : "breeze"}
            visual={
              live
                ? null
                : {
                    buildStep:
                      shipPreview === "records"
                        ? credits
                        : shipPreview === "empty"
                          ? 0
                          : shipPreview === "build"
                            ? buildStep
                            : 30,
                    phase: ["records", "empty", "build"].includes(shipPreview)
                      ? "construction"
                      : "maintenance",
                    health:
                      shipPreview === "wear"
                        ? 91
                        : shipPreview === "repair"
                          ? 94
                          : shipPreview === "storm"
                            ? 15
                            : shipPreview === "zero"
                              ? 0
                              : 100,
                  }
            }
          />
          <div className="journey-tabs simple-tabs" aria-label="عرض الرحلة">
            {[
              ["calendar", "التقويم", CalendarDays],
              ["log", "السجل", Feather],
              ["khatmas", "الختمات", Bookmark],
            ].map(([key, text, Icon]) => (
              <button
                key={key}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                <Icon size={17} />
                {text}
              </button>
            ))}
          </div>
          {tab === "calendar" ? (
            <div className="calendar-layout">
              <JourneyCalendar
                month={month}
                today={currentDay}
                selected={selected}
                onSelect={setSelected}
                onMonth={(m) => {
                  setMonth(m);
                  setSelected(1);
                }}
                demo={!live}
                days={Array.from({ length: days }, (_, i) => ({
                  date: `${month}-${String(i + 1).padStart(2, "0")}`,
                  status: statusFor(i + 1),
                }))}
              />
              <aside className="card day-detail">
                <h3>
                  {ar(selected)} {label}
                </h3>
                {live ? (
                  <>
                    <span className="day-status">
                      {dayLabels[backendReadingStatus(remoteDay?.status)] ||
                        "دون تسجيل"}
                    </span>
                    {ranges(remoteDay?.uniqueCoverage)}
                    {remoteDay?.historicalLevels?.map((l, i) => (
                      <span className="journey-tier" key={i}>
                        {l.label}
                      </span>
                    ))}
                    {remoteDay?.dayCredit === null && (
                      <small className="journey-pending">
                        الرصيد بانتظار اعتماد القاعدة.
                      </small>
                    )}
                  </>
                ) : entries.length ? (
                  entries.map((e) => <EntryRow key={e.id} entry={e} />)
                ) : month === "2026-09" && historyStatuses[selected] ? (
                  <>
                    <span className="day-status">
                      {dayLabels[historyStatuses[selected]]}
                    </span>
                    <span className="journey-mini-caption">مثال للعرض</span>
                  </>
                ) : (
                  <p className="journey-empty">لا توجد قراءة مسجّلة.</p>
                )}
                {!live && date <= currentDay && (
                  <Button
                    variant="secondary"
                    onClick={() => setModal({ type: "log", surah: 2, date })}
                  >
                    <Plus size={16} />
                    إضافة قراءة
                  </Button>
                )}
              </aside>
            </div>
          ) : tab === "log" ? (
            <section className="card log-list">
              {live ? (
                data?.calendar.days.filter((d) => d.uniqueCoverage?.length)
                  .length ? (
                  data.calendar.days
                    .filter((d) => d.uniqueCoverage?.length)
                    .map((d) => (
                      <div className="server-day" key={d.date}>
                        <time>{d.date}</time>
                        {ranges(d.uniqueCoverage)}
                      </div>
                    ))
                ) : (
                  <Empty icon={Feather} title="لا توجد قراءات في هذا الشهر" />
                )
              ) : state.entries.some((e) => !e.retracted) ? (
                state.entries
                  .filter((e) => !e.retracted)
                  .map((e) => (
                    <div key={e.id}>
                      <small>{e.date}</small>
                      <EntryRow entry={e} />
                    </div>
                  ))
              ) : (
                <Empty
                  icon={Feather}
                  title="لا توجد قراءات مسجّلة"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => setModal({ type: "log", surah: 2 })}
                    >
                      <Plus size={16} />
                      إضافة قراءة
                    </Button>
                  }
                />
              )}{" "}
              {!live && state.revisions.length > 0 && (
                <details className="journey-revisions">
                  <summary>التعديلات ({ar(state.revisions.length)})</summary>
                  {state.revisions.map((e, i) => (
                    <p key={i}>
                      سورة {ar(e.surah)} · {ar(e.from)}–{ar(e.to)} · {e.date}
                    </p>
                  ))}
                </details>
              )}
            </section>
          ) : (
            <section className="card journey-khatmas">
              {live && confirmedKhatmas.length ? (
                confirmedKhatmas.map((c) => (
                  <div key={c.id}>
                    <Bookmark size={22} />
                    <strong>ختمة موثّقة</strong>
                    <time>{c.completionDate}</time>
                  </div>
                ))
              ) : (
                <Empty icon={Bookmark} title="لا توجد ختمات مسجّلة" />
              )}
            </section>
          )}
          {live && (
            <div className="journey-live-footer">
              <span>حساب تجريبي · قراءة من الخادم فقط</span>
              <button
                className="text-btn"
                onClick={() => setRefresh((n) => n + 1)}
              >
                <RotateCcw size={15} />
                تحديث
              </button>
            </div>
          )}
        </>
      )}
      {info && (
        <Modal title="عن سجل الرحلة" onClose={() => setInfo(false)}>
          <p>
            {live
              ? "يعرض هذا الوضع سجل حساب BJ2 التجريبي من الخادم المحلي. لا تُرسل إليه سجلاتك المحلية."
              : "حالات السفينة أمثلة من تسليم الرسوم v0.5 ولا تغيّر رصيدك. التقويم يتضمن أمثلة سبتمبر. القراءات التي تضيفها تُحفظ على هذا الجهاز."}
          </p>
          <p className="reader-info-note">
            الختمة سجل مستقل عن السفينة. بناء السفينة وحالتها يحتاجان إسقاطًا
            معتمدًا من الخادم؛ لا نستنتج الصيانة أو الخصم من غياب التسجيل.
          </p>
          <p className="reader-info-note">
            يمكنك تصحيح تسجيلاتك المحلية من السجل. تعديل بيانات الخادم غير متصل
            في هذه النسخة.
          </p>
        </Modal>
      )}
    </section>
  );
}
function BookRangeIcon() {
  return <Check size={16} />;
}
export function Dhikr() {
  const { state, update, notify } = useApp();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(state.dhikr.label);
  const [goal, setGoal] = useState(state.dhikr.goal);
  const [actual, setActual] = useState(state.dhikr.count);
  const d = state.dhikr;
  const percent = Math.min(100, (d.count / d.goal) * 100);
  const add = (n) =>
    update((s) => ({
      ...s,
      dhikr: { ...s.dhikr, count: Math.max(0, s.dhikr.count + n) },
    }));
  return (
    <>
      <Heading
        eyebrow="مساحة للذكر"
        title="لحظةٌ لك، على مهل."
        description="اختر ذكرك وهدفك. سجّل ما قلت فعلًا، بالقدر الذي يناسبك."
      />
      <section className="dhikr-card card">
        <div className="dhikr-top">
          <Pill>ممارسة تختارها بنفسك</Pill>
          <IconButton
            label="تعديل الذكر والعدد"
            onClick={() => {
              setActual(d.count);
              setGoal(d.goal);
              setLabel(d.label);
              setEditing(true);
            }}
          >
            <Edit3 size={19} />
          </IconButton>
        </div>
        <h2>{d.label}</h2>
        <p>هدفك الشخصي: {ar(d.goal)}</p>
        <button
          className="dhikr-counter"
          style={{ "--progress": `${percent * 3.6}deg` }}
          onClick={() => add(1)}
          aria-label="أضف تكرارًا واحدًا إلى الذكر"
        >
          <span>
            <strong>{ar(d.count)}</strong>
            <small>اضغط لإضافة واحدة</small>
            <Plus size={23} />
          </span>
        </button>
        <div className="dhikr-actions">
          <Button
            variant="secondary"
            onClick={() => add(-1)}
            disabled={d.count === 0}
          >
            <Minus size={17} />
            تصحيح −١
          </Button>
          <Button variant="secondary" onClick={() => add(10)}>
            <Plus size={17} />
            ١٠
          </Button>
        </div>
        {d.count >= d.goal && (
          <p className="success-text">
            بلغت العدد الذي اخترته. يمكنك الاكتفاء أو المتابعة.
          </p>
        )}
        <button
          className="text-btn"
          onClick={() => {
            const old = d.count;
            update((s) => ({ ...s, dhikr: { ...s.dhikr, count: 0 } }));
            notify("بدأ العداد من الصفر.", () =>
              update((s) => ({ ...s, dhikr: { ...s.dhikr, count: old } })),
            );
          }}
        >
          <RotateCcw size={16} />
          بدء عدّ جديد
        </button>
        <div className="dhikr-note">
          <Info size={17} />
          <p>
            هذا العدد خاص بك ومنفصل عن ورد القرآن ورصيد السفينة. العدد المعروض
            اقتراح قابل للتغيير، وليس تكليفًا.
          </p>
        </div>
      </section>
      {editing && (
        <Modal title="ذكرك، باختيارك" onClose={() => setEditing(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update((s) => ({
                ...s,
                dhikr: {
                  label: label.trim(),
                  goal: Number(goal),
                  count: Number(actual),
                },
              }));
              setEditing(false);
              notify("حُفظت اختيارات الذكر.");
            }}
          >
            <label className="field">
              الذكر
              <input
                value={label}
                required
                maxLength={120}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="field">
              الهدف الذي تختاره
              <input
                type="number"
                min="1"
                max="1000000"
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </label>
            <label className="field">
              تصحيح العدد الفعلي
              <input
                type="number"
                min="0"
                max="1000000"
                required
                value={actual}
                onChange={(e) => setActual(e.target.value)}
              />
            </label>
            <Button type="submit">
              حفظ اختياراتي
              <Check size={17} />
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
