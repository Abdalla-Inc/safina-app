import {
  CustomCommitmentFields,
  emptyCommitment,
} from "../components/CustomCommitmentFields.jsx";
import {
  CustomCommitmentSettings,
  CustomCommitmentProgress,
} from "./CustomCommitment.jsx";
import { customCommitmentPayload } from "./customCommitment.js";
import { AdminShipPreview, canPreviewShip } from "./AdminShipPreview.jsx";
import { CelebrationConfetti } from "../pages/CommunityFeed.jsx";
import { CommunityAyah } from "../components/CommunityAyah.jsx";
import { ProfileAvatar } from "../components/ProfilePhoto.jsx";
import { LearningTabs } from "../components/LearningTabs.jsx";
import { juzName } from "../data/juzNames.js";
import { weekLabel } from "../data/communityWeeks.js";
import { checkinPalette } from "../data/communityLevels.js";
import "../pages/CommunityFeed.css";
import { customReadingTasks, namedReadingTasks } from "./activityFacts.js";
import { tiers as commitmentLevels } from "../data/model.js";
import {
  ConnectedPreferences,
  ConnectedDailyActivity,
  ConnectedReactions,
  ConnectedIstighfarCorrection,
} from "./Activity.jsx";
import {
  DailyPreferences,
  CountryBadge,
} from "../components/DailyPreferences.jsx";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Heart,
  BookOpen,
  Check,
  RefreshCw,
  UserRound,
  Users,
  Sparkles,
} from "lucide-react";
import { AppContext, useApp, navigate, ar } from "../context.jsx";
import { Button, Heading, Empty, Modal } from "../components/UI.jsx";
import { WirdCapsule } from "../pages/Today.jsx";
import { Reader } from "../pages/Reader.jsx";
import { useAccount } from "./context.js";
import {
  request,
  mutation,
  occurrence,
  pendingFor,
  keepPending,
  removePending,
} from "../services/connected.js";
import "./connected.css";
import { ShipScene } from "../features/safina/ShipScene.jsx";
import { JourneyCalendar } from "../features/safina/JourneyCalendar.jsx";
import { monthDays } from "../features/safina/calendar.js";
import { useShipVisual } from "../features/safina/useShipVisual.js";
import { communityLevels } from "../data/communityLevels.js";
const tiers = ["B", "BI", "BJ1", "BJ2", "BJ3", "BJ4", "BJ5"];
const statusLabel = {
  completed: "مكتمل",
  partial: "قراءة جزئية",
  no_entry: "لم تُسجّل قراءة",
  free_day: "يوم راحة",
  awaiting_policy: "بانتظار اعتماد القاعدة",
  recorded_awaiting_policy: "قراءة مسجّلة · الرصيد بانتظار الاعتماد",
  supplemental_only: "قراءة إضافية",
  not_assigned: "لا يوجد تكليف",
  in_progress: "هذا الأسبوع",
  celebrating: "حصاد الأسبوع",
  archived: "أسبوع سابق",
};
function ErrorMessage({ message }) {
  return message ? (
    <p className="connected-error" role="alert">
      {message}
    </p>
  ) : null;
}
function useRemote(path) {
  const loadedPath = useRef(null);
  const [dataPath, setDataPath] = useState(null);
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    if (loadedPath.current !== path) setData(null);
    loadedPath.current = path;
    request(path)
      .then((value) => {
        if (active) {
          setDataPath(path);
          setData(value);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return {
    data: dataPath === path ? data : null,
    setData: (value) => {
      setDataPath(path);
      setData(value);
    },
    error,
    loading,
    reload: () => setVersion((n) => n + 1),
  };
}
function RemoteState({ remote, children }) {
  if (remote.loading && !remote.data)
    return <p role="status">جارٍ تحميل بيانات حسابك…</p>;
  if (remote.error)
    return (
      <div>
        <ErrorMessage message={remote.error} />
        <Button variant="secondary" onClick={remote.reload}>
          إعادة المحاولة
        </Button>
      </div>
    );
  return remote.data ? children(remote.data) : null;
}
function Ranges({ ranges = [] }) {
  return (
    <span dir="ltr">
      {ranges.map((r) => `${r.start} – ${r.end}`).join(" · ")}
    </span>
  );
}
export function AccountPage() {
  const account = useAccount();
  const health = useRemote("/health");
  const [country, setCountry] = useState(""),
    [goal, setGoal] = useState(100);
  const newSetup = health.data?.capabilities?.countrySetup;
  const [selectedTier, setSelectedTier] = useState("B");
  const [customPlan, setCustomPlan] = useState(emptyCommitment);
  const authIssue = new URLSearchParams(location.search).get("authError");
  const [view, setView] = useState(
      authIssue === "ONBOARDING_REQUIRED" ? "register" : "login",
    ),
    [error, setError] = useState(""),
    [message, setMessage] = useState(
      authIssue === "ONBOARDING_REQUIRED"
        ? "اختر وردك وهدف الاستغفار، ثم تابع مع Google لإنشاء حسابك."
        : authIssue
          ? "تعذّر تسجيل الدخول. حاول مرة أخرى."
          : "",
    );
  const [busy, setBusy] = useState(false),
    [email, setEmail] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    const endpoint = {
      login: "login",
      register: "register",
      verify: "verify",
      recover: "recover",
      reset: "reset-password",
    }[view];
    if (view === "register") {
      fields.communityAcknowledged = fields.communityAcknowledged === "on";
      if (newSetup) fields.istighfarGoal = Number(fields.istighfarGoal);
    }
    try {
      if (view === "register" && selectedTier === "CUSTOM")
        fields.customWird = customCommitmentPayload(customPlan);
      const value = await request(`/auth/${endpoint}`, {
        method: "POST",
        body: fields,
      });
      if (value.csrfToken) {
        if (authIssue)
          history.replaceState(null, "", location.pathname + location.hash);
        await account.signIn(value);
        navigate("today");
      } else {
        setMessage(
          value.message +
            (value.delivery === "local_mailbox"
              ? " في التجربة المحلية، رمز التحقق في صندوق البريد المحلي لدى المشغّل."
              : ""),
        );
        setView(
          view === "register"
            ? "verify"
            : view === "recover"
              ? "reset"
              : "login",
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function google(e) {
    const form = e.currentTarget.form;
    if (
      view === "register" &&
      (!form.elements.displayName.reportValidity() ||
        !form.elements.communityAcknowledged.reportValidity() ||
        (newSetup &&
          (!form.elements.countryCode.reportValidity() ||
            !form.elements.istighfarGoal.reportValidity())))
    )
      return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData(form);
      const body =
        view === "register"
          ? {
              displayName: fd.get("displayName"),
              tier: fd.get("tier"),
              ...(selectedTier === "CUSTOM"
                ? { customWird: customCommitmentPayload(customPlan) }
                : {}),
              ...(newSetup
                ? {
                    countryCode: fd.get("countryCode"),
                    istighfarGoal: Number(fd.get("istighfarGoal")),
                  }
                : {}),
              communityAcknowledged: fd.get("communityAcknowledged") === "on",
            }
          : {};
      const value = await request("/auth/google", { method: "POST", body });
      localStorage.setItem("safina-mode", "connected");
      location.assign(value.url);
    } catch (err) {
      if (err.code === "ONBOARDING_REQUIRED") setView("register");
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <section className="connected-page connected-account">
      <Heading
        title="حسابك في سفينة النور"
        description="ادخل إلى قراءاتك ومجتمعك وموضع المصحف المحفوظ."
      />
      {account.mode === "preview" && (
        <p className="info-box">
          أنت الآن في المعاينة المحلية. بيانات المعاينة لا تنتقل إلى الحساب.
        </p>
      )}
      {account.status === "ready" && account.me ? (
        <div className="connected-card">
          <p>مرحباً {account.me.displayName}</p>
          <Button
            onClick={() => {
              account.chooseMode("connected");
              navigate("today");
            }}
          >
            فتح حسابي
          </Button>
          <Button
            variant="secondary"
            onClick={() => account.logout().catch((e) => setError(e.message))}
          >
            تسجيل الخروج من الأجهزة
          </Button>
        </div>
      ) : (
        <form className="connected-card connected-form" onSubmit={submit}>
          <h2>
            {
              {
                login: "تسجيل الدخول",
                register: "إنشاء حساب",
                verify: "تأكيد البريد",
                recover: "استعادة كلمة المرور",
                reset: "كلمة مرور جديدة",
              }[view]
            }
          </h2>
          <label className="field">
            البريد الإلكتروني
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              dir="ltr"
            />
          </label>
          {["login", "register", "reset"].includes(view) && (
            <label className="field">
              كلمة المرور
              <input
                name="password"
                type="password"
                required
                minLength={view === "login" ? 1 : 12}
                maxLength={256}
                autoComplete={
                  view === "login" ? "current-password" : "new-password"
                }
              />
            </label>
          )}
          {["verify", "reset"].includes(view) && (
            <label className="field">
              رمز التحقق
              <input
                name="code"
                autoComplete="one-time-code"
                required
                maxLength={256}
                dir="ltr"
              />
            </label>
          )}
          {view === "register" && (
            <>
              <label className="field">
                الاسم الظاهر
                <input
                  name="displayName"
                  required
                  maxLength={80}
                  autoComplete="name"
                />
              </label>
              <label className="field">
                الورد
                <select
                  name="tier"
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                >
                  {tiers.map((tier) => (
                    <option key={tier} value={tier}>
                      {commitmentLevels.find((t) => t.id === tier)?.label ||
                        tier}
                    </option>
                  ))}
                  <option value="CUSTOM">ورد مخصّص</option>
                </select>
              </label>
              {selectedTier === "CUSTOM" && (
                <CustomCommitmentFields
                  value={customPlan}
                  onChange={setCustomPlan}
                  disabled={busy}
                />
              )}
              {newSetup && (
                <>
                  <DailyPreferences
                    country={country}
                    goal={goal}
                    onCountry={setCountry}
                    onGoal={setGoal}
                    required
                  />
                  <p>يظهر البلد الذي تختاره بجانب اسمك في المجتمع.</p>
                </>
              )}
              <p>
                يعرض المجتمع تلقائياً الأجزاء المكتملة من وردك وحصاد قراءاتك
                المؤكّدة. لا يعرض بريدك أو ملاحظاتك. يمكنك إخفاء المشاركة من
                الإعدادات.
              </p>
              <label className="connected-check">
                <input name="communityAcknowledged" type="checkbox" required />
                فهمت نطاق المشاركة التلقائية
              </label>
            </>
          )}
          <ErrorMessage message={error} />
          {message && <p role="status">{message}</p>}
          <Button disabled={busy}>{busy ? "جارٍ المتابعة…" : "متابعة"}</Button>
          {["login", "register"].includes(view) && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy || health.data?.googleConfigured === false}
              title={
                health.data?.googleConfigured === false
                  ? "يتاح بعد إعداد تسجيل الدخول مع Google"
                  : undefined
              }
              onClick={google}
            >
              المتابعة مع Google
            </Button>
          )}
          <div className="connected-actions">
            {["login", "register", "recover", "verify"]
              .filter((x) => x !== view)
              .map((x) => (
                <button
                  type="button"
                  className="text-btn"
                  key={x}
                  onClick={() => {
                    setView(x);
                    setError("");
                    setMessage("");
                  }}
                >
                  {
                    {
                      login: "تسجيل الدخول",
                      register: "إنشاء حساب",
                      recover: "نسيت كلمة المرور",
                      verify: "لديّ رمز تحقق",
                    }[x]
                  }
                </button>
              ))}
          </div>
        </form>
      )}
      {account.status === "ready" && <ErrorMessage message={error} />}
      {account.localPreviewEnabled && (
        <Button
          variant="secondary"
          onClick={() => {
            account.chooseMode(
              account.mode === "preview" ? "connected" : "preview",
            );
            navigate("today");
          }}
        >
          {account.mode === "preview"
            ? "فتح وضع الحساب"
            : "العودة إلى المعاينة المحلية"}
        </Button>
      )}
    </section>
  );
}
export function ConnectedRoute({ page, route }) {
  const account = useAccount();
  if (page === "account") return <AccountPage />;
  if (account.status === "loading")
    return <p role="status">جارٍ التحقق من الجلسة…</p>;
  if (account.status === "unavailable")
    return (
      <section className="connected-page">
        <ErrorMessage message={account.error} />
        <Button onClick={account.load}>إعادة الاتصال</Button>
        {account.localPreviewEnabled && (
          <Button
            variant="secondary"
            onClick={() => account.chooseMode("preview")}
          >
            المعاينة المحلية
          </Button>
        )}
      </section>
    );
  if (!account.me) return <AccountPage />;
  if (account.me.setupStatus === "required")
    return (
      <ConnectedPreferences
        key={account.me.id}
        me={account.me}
        onSaved={account.reload}
      />
    );
  return (
    <div className="connected-page" key={account.me.id}>
      {account.session?.mode === "sandbox" && (
        <p className="connected-sandbox">
          حساب اختبار محلي · لا تُرسل رسائل بريد أو بيانات إلى خدمة خارجية
        </p>
      )}
      {page === "reader" ? (
        <ConnectedReader route={route} />
      ) : page === "journey" ? (
        <ConnectedJourney key={account.session?.memberId} />
      ) : page === "community" ? (
        <ConnectedCommunity />
      ) : ["classroom", "library", "course", "lesson", "media"].includes(
          page,
        ) ? (
        <ConnectedLearning route={route} />
      ) : ["settings", "welcome"].includes(page) ? (
        <ConnectedSettings />
      ) : (
        <ConnectedToday />
      )}
    </div>
  );
}
function PendingReading({ onApplied }) {
  const { me } = useAccount();
  const [items, setItems] = useState(() => pendingFor(me.id));
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const changed = () => setItems(pendingFor(me.id));
    addEventListener("safina-pending", changed);
    return () => removeEventListener("safina-pending", changed);
  }, [me.id]);
  if (!items.length) return null;
  const replay = async () => {
    setBusy(true);
    setError("");
    try {
      for (const item of items) {
        await request(item.path, { method: item.method, body: item.body });
        removePending(me.id, item.body.mutationId);
      }
      onApplied();
    } catch (err) {
      setError(
        err.message +
          " الإدخال محفوظ بوقته الأصلي. إذا تغيّر الورد، احذف الطلب بعد مراجعة قراءتك ثم سجّله من اليوم الصحيح.",
      );
    } finally {
      setItems(pendingFor(me.id));
      setBusy(false);
    }
  };
  return (
    <div className="connected-card">
      <p>
        هناك {ar(items.length)} إدخال لم يؤكّد الخادم حفظه. لا يحتسب حتى تتم
        المزامنة.
      </p>
      <ErrorMessage message={error} />
      <Button disabled={busy} onClick={replay}>
        مزامنة الإدخالات المحفوظة
      </Button>
      {items.map((item) => (
        <p key={item.body.mutationId}>
          <time>{item.body.occurredAt}</time>{" "}
          <button
            className="text-btn"
            disabled={busy}
            onClick={() => {
              removePending(me.id, item.body.mutationId);
              setItems(pendingFor(me.id));
            }}
          >
            إزالة الطلب من الجهاز
          </button>
        </p>
      ))}
    </div>
  );
}
function ConnectedToday() {
  const account = useAccount();
  const remote = useRemote(`/today?date=${account.context.day}`);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const write = async (path, method, body) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await request(path, { method, body });
      remote.setData(value.today);
      removePending(account.me.id, body.mutationId);
      dispatchEvent(new Event("safina-pending"));
      await account.reload();
      return true;
    } catch (err) {
      if (err.code === "NETWORK_ERROR") {
        try {
          keepPending(account.me.id, { path, method, body });
          dispatchEvent(new Event("safina-pending"));
        } catch {
          setError(
            "تعذّر حفظ الإدخال على الجهاز. أبقِ الصفحة مفتوحة وأعد المحاولة.",
          );
          return false;
        }
      }
      setError(err.message);
      if (err.status === 409) remote.reload();
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const date = new Date(`${account.context.day}T12:00:00+03:00`);
  return (
    <section className="today-focus" aria-labelledby="connected-wird-date">
      <header className="wird-date-header">
        <div>
          <h1 id="connected-wird-date">
            ورد يوم{" "}
            {new Intl.DateTimeFormat("ar-EG", {
              weekday: "long",
              timeZone: "Asia/Riyadh",
            }).format(date)}
          </h1>
          <time dateTime={account.context.day}>
            {new Intl.DateTimeFormat("ar-EG", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Riyadh",
            }).format(date)}
          </time>
        </div>
      </header>
      <PendingReading onApplied={remote.reload} />
      <ErrorMessage message={error} />
      <RemoteState remote={remote}>
        {(data) => (
          <>
            {data.assignment.freeDay && (
              <p className="quiet-note">لا يوجد ورد مقرّر اليوم</p>
            )}
            {!data.componentStates.length && !data.assignment.freeDay && (
              <p className="quiet-note">جدول الورد بانتظار الاعتماد</p>
            )}
            <CustomCommitmentProgress
              value={data.customWird}
              dailyRanges={data.assignment.ranges}
            />
            <div className="wird-capsules">
              {data.componentStates.map((component) => {
                const name =
                  component.id === "B"
                    ? "سورة البقرة"
                    : component.id === "I"
                      ? "سورة آل عمران"
                      : component.id.startsWith("J")
                        ? `الجزء ${ar(Number(component.id.slice(1)))}`
                        : component.label;
                return (
                  <WirdCapsule
                    key={component.id}
                    row={{ name, total: component.targetVerseCount }}
                    status={{
                      status:
                        component.status === "completed"
                          ? "complete"
                          : component.status,
                      count: component.coveredVerseCount,
                    }}
                    disabled={busy}
                    onChange={(completed) =>
                      write(
                        `/today/components/${encodeURIComponent(component.id)}`,
                        "PUT",
                        mutation({
                          assignmentId: data.assignment.id,
                          expectedInputHash: data.evaluation.inputHash,
                          completed,
                          ...occurrence(),
                        }),
                      )
                    }
                  />
                );
              })}
            </div>
            {account.me.capabilities?.customReading && data.istighfar && (
              <ConnectedDailyActivity
                key={data.assignmentDay}
                data={data}
                write={write}
                busy={busy}
                error={error}
              />
            )}
            <Button className="wird-start" onClick={() => navigate("reader")}>
              <BookOpen size={19} />
              ابدأ القراءة
              <ArrowLeft size={18} />
            </Button>
          </>
        )}
      </RemoteState>
    </section>
  );
}
function ConnectedReader({ route }) {
  const base = useApp();
  const remote = useRemote("/reader");
  return (
    <RemoteState remote={remote}>
      {(value) => (
        <ReaderBridge
          key={value.edition}
          initial={value}
          base={base}
          route={route}
        />
      )}
    </RemoteState>
  );
}
function ReaderBridge({ initial, base, route }) {
  const saved = useRef(initial),
    desired = useRef(initial),
    working = useRef(false),
    mounted = useRef(true);
  const [readerState, setReaderState] = useState({
    reader: { page: initial.page },
    mushafBookmarks: initial.bookmarks,
  });
  const stateRef = useRef(readerState);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  async function flush() {
    if (working.current) return;
    working.current = true;
    setPending(true);
    setError("");
    try {
      while (
        JSON.stringify([saved.current.page, saved.current.bookmarks]) !==
        JSON.stringify([desired.current.page, desired.current.bookmarks])
      ) {
        const target = { ...desired.current };
        saved.current = await request("/reader", {
          method: "PUT",
          body: mutation({
            edition: initial.edition,
            mapVersion: initial.mapVersion,
            page: target.page,
            bookmarks: target.bookmarks,
            expectedRevision: saved.current.revision,
          }),
        });
      }
    } catch (err) {
      if (mounted.current) setError(err.message + " موضع المصحف لم يُحفظ بعد.");
    } finally {
      working.current = false;
      if (mounted.current) setPending(false);
    }
  }
  const update = (change) => {
    const next =
      typeof change === "function"
        ? change(stateRef.current)
        : { ...stateRef.current, ...change };
    stateRef.current = next;
    setReaderState(next);
    desired.current = {
      ...desired.current,
      page: next.reader.page,
      bookmarks: [...new Set(next.mushafBookmarks)].sort((a, b) => a - b),
    };
    flush();
  };
  return (
    <AppContext.Provider value={{ ...base, state: readerState, update }}>
      <ErrorMessage message={error} />
      {error && <Button onClick={flush}>إعادة محاولة الحفظ</Button>}
      {pending && <p role="status">جارٍ حفظ موضع المصحف…</p>}
      <Reader surahId={route.split("/")[1]} ayah={route.split("/")[2]} />
    </AppContext.Provider>
  );
}
function ConnectedJourney() {
  const { context, me, session } = useAccount();
  const [month, setMonth] = useState(context.day.slice(0, 7));
  const [selected, setSelected] = useState(Number(context.day.slice(8)));
  const [refresh, setRefresh] = useState(0);
  const [previewVisual, setPreviewVisual] = useState(null);
  const previewShip = canPreviewShip(me) && !!previewVisual;
  const end = `${month}-${monthDays(month)}`;
  const calendar = useRemote(
    `/calendar?start=${month}-01&end=${end > context.day ? context.day : end}`,
  );
  const visual = useShipVisual(session.memberId, context.day, refresh);
  const date = `${month}-${String(selected).padStart(2, "0")}`;
  return (
    <section className="simple-journey">
      <div className="journey-topline">
        <h1>رحلتي</h1>
        <button
          className="text-btn"
          onClick={() => {
            calendar.reload();
            setRefresh((n) => n + 1);
          }}
        >
          <RefreshCw size={16} />
          تحديث
        </button>
      </div>
      {canPreviewShip(me) && (
        <AdminShipPreview key={me.id} onPreview={setPreviewVisual} />
      )}
      {!previewShip && visual.status === "loading" ? (
        <p role="status">جارٍ تحميل سفينتك…</p>
      ) : (
        <>
          <ShipScene
            key={session.memberId}
            visual={
              previewShip ? previewVisual : visual.projection?.state || null
            }
            preview={previewShip}
            reducedMotion={!!me.reducedMotion}
          />
          {visual.status === "error" && (
            <p className="connected-error" role="status">
              تعذّر تحديث السفينة.
              {visual.projection
                ? " تُعرض آخر حالة مؤكّدة؛ قد تكون قديمة."
                : ""}
            </p>
          )}
        </>
      )}
      <RemoteState remote={calendar}>
        {(data) => {
          const day = data.days.find((d) => d.date === date);
          return (
            <>
              <JourneyCalendar
                month={month}
                today={context.day}
                days={data.days}
                selected={selected}
                onSelect={setSelected}
                onMonth={(m) => {
                  setMonth(m);
                  setSelected(1);
                }}
              />
              <section
                className="safina-connected-detail"
                aria-label="تفاصيل اليوم"
              >
                <h3>{date}</h3>
                <p>
                  {date > context.day
                    ? "يوم قادم"
                    : day
                      ? !day.historicalLevels?.length
                        ? "قبل بدء الورد"
                        : statusLabel[day.status] || "بانتظار التقييم"
                      : "بيانات اليوم غير متاحة"}
                </p>
                {day && (
                  <>
                    <p>
                      <Ranges ranges={day.uniqueCoverage} />
                    </p>
                    <DayCorrections
                      day={date}
                      onChange={() => {
                        calendar.reload();
                        setRefresh((n) => n + 1);
                      }}
                    />
                    {day.corrected && <p>يتضمن تصحيحاً لقراءة سابقة</p>}
                    {day.khatmaMarks?.length > 0 && (
                      <p>ختمة مثبتة بتغطية القرآن</p>
                    )}
                  </>
                )}
              </section>
            </>
          );
        }}
      </RemoteState>
    </section>
  );
}

function Card({ card, kind, onChange, own = false }) {
  const { quran } = useApp();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function heart(emoji) {
    setBusy(true);
    setError("");
    try {
      await request(
        `/community/${kind}/${encodeURIComponent(card.id)}/reaction`,
        {
          method: "PUT",
          body: mutation({
            ...(card.reactions ? { emoji } : { reacted: !card.viewerReacted }),
            expectedRevision: card.reactionRevision,
          }),
        },
      );
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const latest = card.levelSegments?.at(-1);
  const palette = checkinPalette({
    tierAtCompletion: latest?.tierId || latest?.tier,
  });
  const tasks =
    kind === "daily"
      ? [
          ...(card.completedComponents || []).flatMap((x) =>
            x.id === "CUSTOM"
              ? namedReadingTasks(x.ranges)
              : [
                  {
                    name:
                      x.id === "B"
                        ? "سورة البقرة"
                        : x.id === "I"
                          ? "سورة آل عمران"
                          : x.id.startsWith("J")
                            ? juzName(Number(x.id.slice(1)))
                            : x.label,
                  },
                ],
          ),
          ...customReadingTasks(card),
          ...(card.istighfar?.count > 0
            ? [{ name: `استغفار ${ar(card.istighfar.count)} مرة` }]
            : []),
        ]
      : [
          ...(card.facts || []).flatMap((f) =>
            f.kind === "surah_completion"
              ? [
                  {
                    name: `سورة ${quran.find((s) => s.id === f.surahId)?.name || ar(f.surahId)}`,
                    detail: `${ar(f.count)} مرة`,
                  },
                ]
              : f.kind === "juz_coverage"
                ? f.juzIds.map((id) => ({
                    name: juzName(id),
                    detail: "ضمن القراءة المسجّلة",
                  }))
                : namedReadingTasks(f.ranges),
          ),
          ...(card.istighfarTotal > 0
            ? [{ name: `استغفار ${ar(card.istighfarTotal)} مرة` }]
            : []),
          ...(card.quranKhatmas || []).map(() => ({ name: "ختمة قرآن كاملة" })),
        ];
  const stamp = card.meaningfulAt || card.updatedAt;
  return (
    <article
      className={`checkin-card ${kind === "weekly" ? "weekly-card" : ""}`}
      style={{
        "--level-accent": palette.accent,
        "--level-tint": palette.tint,
        "--level-line": palette.line,
      }}
    >
      <div className="checkin-author">
        <ProfileAvatar
          src={card.member?.avatarUrl}
          name={card.member?.displayName || "حصادي"}
        />
        <div className="checkin-identity">
          <h2>
            {card.member?.displayName || "حصادي"}
            <CountryBadge code={card.member?.countryCode} />
            {own && <small>أنت</small>}
          </h2>
          <time>
            {kind === "weekly"
              ? weekLabel(card.weekStart)
              : stamp && !isNaN(Date.parse(stamp))
                ? new Intl.DateTimeFormat("ar-EG", {
                    timeZone: "Asia/Riyadh",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(stamp))
                : card.day}
          </time>
        </div>
        <span
          className="checkin-level-mark"
          title={palette.label}
          aria-label={palette.label}
        >
          <span />
          <span />
          <span />
        </span>
      </div>
      <div className="checkin-reading">
        <span>{kind === "weekly" ? "حصاد الأسبوع" : "ورد اليوم"}</span>
        <ul>
          {tasks.map((task, i) => (
            <li key={i}>
              {kind === "daily" && i > 0 && (
                <span className="checkin-plus" aria-hidden="true">
                  +
                </span>
              )}
              <div>
                {task.name}
                {task.detail && <small>{task.detail}</small>}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="checkin-bottom">
        <span>
          {kind === "weekly" ? (
            <>
              <Sparkles size={15} />
              نحتفي بكل خطوة
            </>
          ) : card.completeWird ? (
            <>
              <Check size={15} />
              ورد اليوم مكتمل
            </>
          ) : (
            "من ورد اليوم"
          )}
        </span>
        {card.reactions ? (
          <ConnectedReactions card={card} busy={busy} onReact={heart} />
        ) : (
          <button
            className="emoji-reaction"
            aria-label="محبة"
            disabled={busy || card.visibility !== "visible"}
            aria-pressed={card.viewerReacted || false}
            onClick={() => heart()}
          >
            ❤️ {ar(card.heartCount || 0)}
          </button>
        )}
      </div>
      {own && kind === "weekly" && (
        <button
          className="text-btn"
          onClick={() => navigate(`community/week/${card.weekStart}`)}
        >
          أوراد الأسبوع <ArrowLeft size={14} />
        </button>
      )}
      <ErrorMessage message={error} />
    </article>
  );
}
function ConnectedCommunity() {
  const { context, me } = useAccount();
  const forcedCelebration = location.hash === "#/community/celebration";
  const [motion, setMotion] = useState(true);
  const [tab, setTab] = useState(
      context.restDay || forcedCelebration ? "weekly" : "daily",
    ),
    [cursor, setCursor] = useState(null),
    [prior, setPrior] = useState([]);
  const [before, setBefore] = useState(null);
  const weekRoute = location.hash.split("/");
  const detailWeek = weekRoute[2] === "week" ? weekRoute[3] : null;
  const path = detailWeek
    ? `/me/community/weeks/${detailWeek}/days`
    : tab === "mine"
      ? `/me/community/weeks${before ? "?before=" + encodeURIComponent(before) : ""}`
      : `/community/${tab}?${tab === "daily" ? "day=" + context.day : "weekStart=" + context.weekStart}${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`;
  const remote = useRemote(path);
  const refresh = () => {
    setPrior([]);
    setCursor(null);
    setBefore(null);
    remote.reload();
  };
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden && !cursor) remote.reload();
    }, 30000);
    return () => clearInterval(id);
  }, [path, cursor]);
  useEffect(() => {
    setPrior([]);
    setCursor(null);
    setBefore(null);
    setTab(context.restDay || forcedCelebration ? "weekly" : "daily");
  }, [context.day, context.weekStart, forcedCelebration]);
  return (
    <section
      className={`community-page ${tab === "weekly" ? "community-celebrating" : ""}`}
    >
      <CelebrationConfetti
        enabled={tab === "weekly" && motion && !me.reducedMotion && !detailWeek}
      />
      <div className="community-date">
        <time>
          {new Intl.DateTimeFormat("ar-EG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Asia/Riyadh",
          }).format(new Date(`${context.day}T12:00:00+03:00`))}
        </time>
        <span>بتوقيت مكة</span>
        <button
          className="community-profile"
          onClick={refresh}
          aria-label="تحديث المشاركات"
        >
          <RefreshCw size={17} />
        </button>
      </div>
      {!detailWeek && tab !== "mine" && (
        <>
          <CommunityAyah
            day={context.day}
            weekStart={context.weekStart}
            weekly={tab === "weekly"}
          />
          <header className="community-count">
            <Users size={23} />
            <div aria-live="polite">
              <strong>
                {remote.data
                  ? ar(
                      tab === "daily"
                        ? remote.data.completeWirdMemberCount
                        : remote.data.participantCount,
                    )
                  : "—"}
              </strong>
              <span>
                {tab === "daily"
                  ? "أتمّوا وردهم اليوم"
                  : "نحتفي بجهودهم هذا الأسبوع"}
              </span>
            </div>
          </header>
        </>
      )}
      <div className="community-feed-tools">
        <div
          className="community-filters"
          role="group"
          aria-label="عرض المشاركات"
        >
          {[
            ["daily", "اليوم"],
            ["weekly", "حصاد الأسبوع"],
            ["mine", "أورادي"],
          ].map(([key, title]) => (
            <button
              key={key}
              aria-pressed={tab === key && !detailWeek}
              onClick={() => {
                setTab(key);
                setCursor(null);
                setBefore(null);
                setPrior([]);
                navigate("community");
              }}
            >
              {title}
            </button>
          ))}
        </div>
      </div>
      {tab === "weekly" && !detailWeek && (
        <div className="celebration-caption">
          <div>
            <strong>نحتفي بكل خطوة</strong>
            <span>{weekLabel(context.weekStart)}</span>
          </div>
          {!me.reducedMotion && (
            <button
              className="celebration-motion-toggle"
              aria-label={motion ? "إيقاف الاحتفال" : "تشغيل الاحتفال"}
              aria-pressed={motion}
              onClick={() => setMotion((x) => !x)}
            >
              <Sparkles size={17} />
            </button>
          )}
        </div>
      )}
      <RemoteState remote={remote}>
        {(data) =>
          detailWeek ? (
            <div>
              {data.days.length ? (
                data.days.map((day) => (
                  <div className="connected-card" key={day.day}>
                    <h2>{day.day}</h2>
                    <p>
                      <Ranges ranges={day.ranges} />
                    </p>
                    <DayCorrections day={day.day} onChange={refresh} />
                    <ConnectedIstighfarCorrection
                      key={`dhikr:${day.day}:${day.istighfar?.revision}`}
                      value={day.istighfar}
                      onSaved={refresh}
                    />
                    <p>{day.corrected ? "يتضمن تصحيحاً" : "قراءة مؤكّدة"}</p>
                    {day.dailyPost && (
                      <Card
                        card={day.dailyPost}
                        kind="daily"
                        own
                        onChange={refresh}
                      />
                    )}
                  </div>
                ))
              ) : (
                <Empty title="لا توجد قراءات مسجّلة في هذا الأسبوع" />
              )}
            </div>
          ) : (
            <>
              <div className="connected-feed">
                {[...prior, ...data.items].map((card) => (
                  <Card
                    key={card.id}
                    card={card}
                    kind={tab === "daily" ? "daily" : "weekly"}
                    own={tab === "mine"}
                    onChange={refresh}
                  />
                ))}
              </div>
              {!data.items.length && !prior.length && (
                <Empty title="لا توجد مشاركة بعد">
                  ستظهر القراءة المؤكّدة تلقائياً وفق نطاق المشاركة.
                </Empty>
              )}
              {data.nextCursor && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPrior((p) => [...p, ...data.items]);
                    setCursor(data.nextCursor);
                  }}
                >
                  عرض المزيد
                </Button>
              )}
              {data.nextBefore && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPrior((p) => [...p, ...data.items]);
                    setBefore(data.nextBefore);
                  }}
                >
                  أسابيع أقدم
                </Button>
              )}
            </>
          )
        }
      </RemoteState>
    </section>
  );
}
function ConnectedSettings() {
  const account = useAccount(),
    { me } = account;
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState(false);
  async function run(fn) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        title="حسابي وإعداداتي"
        description="تغييرات الاسم والصورة لا تغيّر تاريخ قراءاتك أو مستوياتك السابقة."
      />
      <ErrorMessage message={error} />
      {message && <p role="status">{message}</p>}
      {me.capabilities?.countrySetup && (
        <ConnectedPreferences
          key={`preferences:${me.revision}`}
          me={me}
          onSaved={account.reload}
        />
      )}
      <CustomCommitmentSettings
        key={`custom-plan:${me.commitment?.effective?.id}:${me.commitment?.pending?.length}`}
        me={me}
        onSaved={account.reload}
      />
      <form
        key={me.revision}
        className="connected-card connected-form"
        onSubmit={(e) => {
          e.preventDefault();
          const values = new FormData(e.currentTarget);
          run(async () => {
            await request("/me", {
              method: "PATCH",
              body: mutation({
                expectedRevision: me.revision,
                displayName: values.get("displayName"),
                communityVisible: values.get("communityVisible") === "on",
                largeText: values.get("largeText") === "on",
                reducedMotion: values.get("reducedMotion") === "on",
              }),
            });
            await account.reload();
            setMessage("حُفظت الإعدادات.");
          });
        }}
      >
        <label className="field">
          الاسم الظاهر
          <input
            name="displayName"
            defaultValue={me.displayName}
            required
            maxLength={80}
            autoComplete="name"
          />
        </label>
        <p>{me.email}</p>
        <label className="connected-check">
          <input
            name="communityVisible"
            type="checkbox"
            defaultChecked={me.communityVisible}
          />
          إظهار مشاركات قراءتي تلقائياً للمجتمع
        </label>
        <label className="connected-check">
          <input
            name="largeText"
            type="checkbox"
            defaultChecked={me.largeText}
          />
          نص أكبر
        </label>
        <label className="connected-check">
          <input
            name="reducedMotion"
            type="checkbox"
            defaultChecked={me.reducedMotion}
          />
          تقليل الحركة
        </label>
        <Button disabled={busy}>حفظ الإعدادات</Button>
      </form>
      <div className="connected-card">
        <h2>الصورة الشخصية</h2>
        {me.avatarUrl && (
          <img
            className="connected-avatar"
            src={me.avatarUrl}
            alt="صورتك الشخصية"
          />
        )}
        <label className="field">
          اختر JPEG أو PNG أو WebP حتى ١٠ ميغابايت
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              run(async () => {
                if (file.size > 10 * 1024 * 1024)
                  throw Error("الصورة أكبر من ١٠ ميغابايت.");
                const data = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result.split(",")[1]);
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });
                await request("/me/avatar", {
                  method: "PUT",
                  body: mutation({
                    expectedRevision: me.revision,
                    dataBase64: data,
                  }),
                });
                await account.reload();
              });
            }}
          />
        </label>
        {me.avatarUrl && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await request("/me/avatar", {
                  method: "DELETE",
                  body: mutation({ expectedRevision: me.revision }),
                });
                await account.reload();
              })
            }
          >
            إزالة الصورة
          </Button>
        )}
      </div>
      <form
        className="connected-card connected-form"
        onSubmit={(e) => {
          e.preventDefault();
          const tier = new FormData(e.currentTarget).get("tier");
          run(async () => {
            const value = await request("/me/commitment", {
              method: "POST",
              body: mutation({
                tier,
                expectedCommitmentId: me.commitment.effective.id,
                ruleVersion: me.commitment.effective.ruleVersion,
              }),
            });
            await account.reload();
            setMessage(
              `حُفظ تغيير الورد${(value.change || value.commitment)?.effectiveAt ? ` · يبدأ ${new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeZone: "Asia/Riyadh" }).format(new Date((value.change || value.commitment).effectiveAt))}` : ""}`,
            );
          });
        }}
      >
        <h2>وردي</h2>
        <p>
          الورد الحالي:{" "}
          {me.commitment.effective.tier === "CUSTOM"
            ? "ورد مخصّص"
            : commitmentLevels.find(
                (t) => t.id === me.commitment.effective.tier,
              )?.label || me.commitment.effective.tier}
        </p>
        {me.commitment.pending.map((c) => (
          <p key={c.id}>
            {c.tier === "CUSTOM"
              ? "ورد مخصّص"
              : commitmentLevels.find((t) => t.id === c.tier)?.label ||
                c.tier}{" "}
            · يبدأ{" "}
            {new Intl.DateTimeFormat("ar-EG", {
              dateStyle: "medium",
              timeZone: "Asia/Riyadh",
            }).format(new Date(c.effectiveAt))}
          </p>
        ))}
        <label className="field">
          اختيار المستوى
          <select name="tier" defaultValue={me.commitment.effective.tier}>
            {tiers.map((tier) => (
              <option key={tier} value={tier}>
                {commitmentLevels.find((t) => t.id === tier)?.label || tier}
              </option>
            ))}
          </select>
        </label>
        <p>
          {me.commitment.effective.tier === "CUSTOM"
            ? "الانتقال إلى مستوى آخر يبدأ غدًا بتوقيت مكة."
            : "التغييرات الأسبوعية تبدأ الأحد القادم. الانتقال بين الورد الأسبوعي وغيره بانتظار اعتماد القاعدة."}
        </p>
        <Button disabled={busy || !!me.commitment.pending.length}>
          طلب تغيير الورد
        </Button>
      </form>
      <div className="connected-card">
        <h2>بيانات حسابي</h2>
        <div className="connected-actions">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const value = await request("/me/export");
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(value, null, 2)], {
                    type: "application/json",
                  }),
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = "safina-account-export.json";
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              })
            }
          >
            تنزيل نسخة من بياناتي
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => run(account.logout)}
          >
            تسجيل الخروج من الأجهزة
          </Button>
          {account.localPreviewEnabled && (
            <Button
              variant="secondary"
              onClick={() => account.chooseMode("preview")}
            >
              فتح المعاينة المحلية
            </Button>
          )}
          <Button variant="secondary" onClick={() => setDeleting(true)}>
            طلب حذف الحساب
          </Button>
        </div>
      </div>
      {deleting && (
        <Modal
          title="طلب حذف الحساب"
          onClose={() => !busy && setDeleting(false)}
        >
          <form
            className="connected-form"
            onSubmit={(e) => {
              e.preventDefault();
              const confirmation = new FormData(e.currentTarget).get(
                "confirmation",
              );
              run(async () => {
                const value = await request("/me/deletion", {
                  method: "POST",
                  body: mutation({ confirmation }),
                });
                account.discard();
                localStorage.setItem(
                  "safina-account-event",
                  crypto.randomUUID(),
                );
                navigate("account");
              });
            }}
          >
            <p>
              ستُخفى المشاركات والصورة فوراً وتُغلق جلسات الحساب. محو السجل
              نهائياً يبقى قيد مراجعة سياسة الاحتفاظ. نزّل نسخة بياناتك قبل
              المتابعة.
            </p>
            <label className="field">
              اكتب DELETE للتأكيد
              <input name="confirmation" required pattern="DELETE" dir="ltr" />
            </label>
            <Button disabled={busy}>تأكيد طلب الحذف</Button>
            <ErrorMessage message={error} />
          </form>
        </Modal>
      )}
    </>
  );
}
function ConnectedLearning({ route }) {
  const parts = route.split("/");
  if (parts[0] === "lesson" && parts[1] && parts[2])
    return (
      <ConnectedLesson key={route} courseId={parts[1]} lessonId={parts[2]} />
    );
  if (parts[0] === "course" && parts[1])
    return <ConnectedCourse key={route} id={parts[1]} />;
  return <LearningCatalog library={parts[0] === "library"} />;
}
function LearningCatalog({ library }) {
  const [query, setQuery] = useState(""),
    [cursor, setCursor] = useState(null),
    [prior, setPrior] = useState([]);
  const path = library
    ? `/learning/library?q=${encodeURIComponent(query)}`
    : "/learning/courses?";
  const remote = useRemote(
    path + (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""),
  );
  useEffect(() => {
    setPrior([]);
    setCursor(null);
  }, [library, query]);
  return (
    <>
      <LearningTabs active={library ? "library" : "courses"} />
      <div className="course-topline">
        <h1>{library ? "المكتبة" : "الدورات"}</h1>
      </div>
      {library && (
        <form
          className="connected-form"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(new FormData(e.currentTarget).get("q"));
          }}
        >
          <label className="field">
            البحث في المحتوى المعتمد
            <input name="q" maxLength={200} type="search" />
          </label>
          <Button>بحث</Button>
        </form>
      )}
      <RemoteState remote={remote}>
        {(data) =>
          data.items.length ? (
            <>
              <div className="course-collection">
                {[...prior, ...data.items].map((item) => (
                  <article className="course-tile" key={item.id}>
                    <div className="course-cover connected-course-cover">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" />
                      ) : (
                        <BookOpen size={48} strokeWidth={1} />
                      )}
                    </div>
                    <div className="course-tile-body">
                      <h2>{item.title}</h2>
                      {item.sandbox && <p>محتوى اختبار محلي</p>}
                      {library ? (
                        <>
                          {item.transcript && (
                            <details>
                              <summary>عن المحتوى</summary>
                              <p>{item.transcript}</p>
                            </details>
                          )}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              فتح المصدر
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <p>
                            {ar(item.completedModules)} من{" "}
                            {ar(item.moduleCount)} وحدات مكتملة
                          </p>
                          <Button
                            disabled={item.access === "not_enrolled"}
                            onClick={() => navigate(`course/${item.id}`)}
                          >
                            {item.access === "not_enrolled"
                              ? "تحتاج تسجيلاً في الدورة"
                              : "فتح الدورة"}
                          </Button>
                          {item.access === "founder_preview" && (
                            <p>معاينة المؤسّس · لا تمنح إتماماً تلقائياً</p>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {data.nextCursor && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPrior((p) => [...p, ...data.items]);
                    setCursor(data.nextCursor);
                  }}
                >
                  عرض المزيد
                </Button>
              )}
            </>
          ) : (
            <Empty
              title={
                library
                  ? "لا يوجد محتوى معتمد يطابق البحث"
                  : "الدورات قيد الإعداد"
              }
            >
              سيظهر المحتوى بعد إعداده واعتماد حقوقه. الأمثلة الموجودة في
              المعاينة المحلية ليست دورات منشورة.
            </Empty>
          )
        }
      </RemoteState>
    </>
  );
}
function ConnectedCourse({ id }) {
  const remote = useRemote(`/learning/courses/${encodeURIComponent(id)}`);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => navigate("classroom")}>
        كل الدورات
      </Button>
      <ErrorMessage message={error} />
      <RemoteState remote={remote}>
        {(course) => (
          <>
            <Heading
              title={course.title}
              description={
                course.access === "founder_preview"
                  ? "معاينة المؤسّس. يبقى الإتمام منفصلاً عن صلاحية العرض."
                  : "أكمل الدروس المطلوبة وأرسل الإجابات لفتح الأسبوع التالي."
              }
            />
            {course.modules.map((module) => (
              <section className="connected-card" key={module.id}>
                <h2>{module.title}</h2>
                <p>
                  {!module.accessible
                    ? "مغلق حتى إتمام الأسابيع السابقة"
                    : module.complete
                      ? "مكتمل"
                      : "متاح"}
                </p>
                {module.lessons.map((lesson) => (
                  <div className="connected-actions" key={lesson.id}>
                    <span>
                      {lesson.title}
                      {lesson.required ? " · مطلوب" : ""}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={!module.accessible}
                      onClick={() => navigate(`lesson/${id}/${lesson.id}`)}
                    >
                      فتح الدرس
                    </Button>
                    {lesson.progress?.completed && <Check aria-label="مكتمل" />}
                  </div>
                ))}
                {module.accessible && (
                  <form
                    className="connected-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      setError("");
                      const fd = new FormData(e.currentTarget);
                      const answers = Object.fromEntries(
                        module.questions.map((q) => [q.id, fd.get(q.id)]),
                      );
                      const submit =
                        e.nativeEvent.submitter?.value === "submit";
                      try {
                        const value = await request(
                          `/learning/courses/${id}/modules/${module.id}/answers${submit ? "/submit" : ""}`,
                          {
                            method: submit ? "POST" : "PUT",
                            body: mutation({
                              expectedRevision: module.answers.revision,
                              courseVersion: course.version,
                              answers,
                            }),
                          },
                        );
                        remote.setData(value.course);
                      } catch (err) {
                        setError(err.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {module.questions.map((q) => (
                      <label className="field" key={q.id}>
                        {q.prompt}
                        {q.required ? " (مطلوب للإرسال)" : ""}
                        <textarea
                          name={q.id}
                          maxLength={20000}
                          defaultValue={module.answers.answers?.[q.id] || ""}
                        />
                      </label>
                    ))}
                    <p>
                      {module.answers.state === "submitted"
                        ? "أُرسلت الإجابات. لم تُمنح درجة تقييم."
                        : "الإجابات خاصة بحسابك."}
                    </p>
                    <div className="connected-actions">
                      <Button variant="secondary" disabled={busy} value="draft">
                        حفظ المسودة
                      </Button>
                      <Button disabled={busy} value="submit">
                        إرسال الإجابات وإتمام الوحدة
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            ))}
          </>
        )}
      </RemoteState>
    </>
  );
}
function ConnectedLesson({ courseId, lessonId }) {
  const path = `/learning/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`;
  const remote = useRemote(path);
  const video = useRef(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function save(kind, payload) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await request(`${path}/${kind}`, {
        method: "PUT",
        body: mutation({
          expectedRevision: remote.data[kind].revision,
          courseVersion: remote.data.courseVersion,
          ...payload,
        }),
      });
      remote.setData({ ...remote.data, [kind]: value.record });
      setMessage("حُفظ التعديل.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => navigate(`course/${courseId}`)}
      >
        العودة إلى الدورة
      </Button>
      <ErrorMessage message={error} />
      {message && <p role="status">{message}</p>}
      <RemoteState remote={remote}>
        {(lesson) => (
          <>
            <Heading title={lesson.title} />
            {lesson.playback.kind === "youtube" ? (
              lesson.playback.url ? (
                <iframe
                  className="connected-video"
                  title={lesson.title}
                  src={lesson.playback.url}
                  allow="encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <p className="info-box">
                  العرض المضمّن غير متاح.{" "}
                  <a
                    href={lesson.playback.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    فتح المصدر في YouTube
                  </a>
                </p>
              )
            ) : lesson.playback.url ? (
              <video
                ref={video}
                controls
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
                src={lesson.playback.url}
                poster={lesson.thumbnail || undefined}
                onLoadedMetadata={() => {
                  if (video.current)
                    video.current.currentTime =
                      lesson.progress.positionSeconds || 0;
                }}
                onError={() =>
                  setError(
                    "تعذّر تشغيل الفيديو. أعد فتح الدرس لتحديث رابط التشغيل.",
                  )
                }
              >
                {lesson.captions?.map((track) => (
                  <track
                    key={track.id}
                    kind="captions"
                    src={track.url}
                    srcLang={track.language}
                    label={track.label}
                  />
                ))}
              </video>
            ) : (
              <p className="info-box">لم يُضف فيديو معتمد لهذا الدرس بعد.</p>
            )}
            <div className="connected-actions">
              <Button
                variant="secondary"
                disabled={busy || lesson.playback.kind === "youtube"}
                onClick={() =>
                  save("progress", {
                    positionSeconds:
                      video.current?.currentTime ??
                      lesson.progress.positionSeconds ??
                      0,
                    completed: lesson.progress.completed || false,
                  })
                }
              >
                حفظ موضع التشغيل
              </Button>
              <Button
                disabled={
                  busy || lesson.completionPolicy !== "member_confirmation"
                }
                onClick={() =>
                  save("progress", {
                    positionSeconds:
                      video.current?.currentTime ??
                      lesson.progress.positionSeconds ??
                      0,
                    completed: !lesson.progress.completed,
                  })
                }
              >
                {lesson.progress.completed
                  ? "التراجع عن إتمام الدرس"
                  : "أؤكّد إتمام الدرس"}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                aria-pressed={lesson.bookmark.saved || false}
                onClick={() =>
                  save("bookmark", { saved: !lesson.bookmark.saved })
                }
              >
                {lesson.bookmark.saved ? "إزالة الحفظ" : "حفظ الدرس"}
              </Button>
              <Button variant="secondary" onClick={remote.reload}>
                تحديث رابط التشغيل
              </Button>
            </div>
            {lesson.resources?.length > 0 && (
              <ul>
                {lesson.resources.map((resource) => (
                  <li key={resource.id || resource.url}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {resource.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="connected-card connected-form"
              onSubmit={(e) => {
                e.preventDefault();
                save("note", {
                  body: new FormData(e.currentTarget).get("note"),
                });
              }}
            >
              <label className="field">
                ملاحظاتي الخاصة
                <textarea
                  name="note"
                  defaultValue={lesson.note.body || ""}
                  maxLength={20000}
                  rows="8"
                />
              </label>
              <Button disabled={busy}>حفظ الملاحظات</Button>
            </form>
          </>
        )}
      </RemoteState>
    </>
  );
}
function DayCorrections({ day, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        مراجعة إدخالات القراءة
      </Button>
      {open && (
        <Modal title={`قراءات ${day}`} onClose={() => setOpen(false)}>
          <ReadingCorrections day={day} onChange={onChange} />
        </Modal>
      )}
    </>
  );
}
function ReadingCorrections({ day, onChange }) {
  const remote = useRemote(`/me/reading-acts?day=${day}`),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function correct(e, act) {
    e.preventDefault();
    const values = new FormData(e.currentTarget),
      retract = e.nativeEvent.submitter?.value === "retract";
    const body = mutation({
      expectedRevision: act.revision,
      reason: values.get("reason"),
    });
    if (!retract)
      Object.assign(body, {
        ruleVersion: act.ruleVersion,
        referenceVersion: act.referenceVersion,
        ranges: act.ranges.map((_, i) => ({
          start: values.get(`start${i}`),
          end: values.get(`end${i}`),
        })),
      });
    setBusy(true);
    setError("");
    try {
      await request(`/reading-acts/${act.id}${retract ? "/retract" : ""}`, {
        method: retract ? "POST" : "PATCH",
        body,
      });
      remote.reload();
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ErrorMessage message={error} />
      <RemoteState remote={remote}>
        {(data) =>
          data.items.length ? (
            data.items.map((act) => (
              <form
                key={`${act.id}:${act.revision}`}
                className="connected-card connected-form"
                onSubmit={(e) => correct(e, act)}
              >
                <p>
                  الوقت الأصلي: {act.occurredAt} · {act.timezone}
                </p>
                <p>
                  {act.retracted ? "إدخال مسحوب" : `مراجعة ${ar(act.revision)}`}
                </p>
                {act.ranges.map((range, i) => (
                  <div className="connected-columns" key={i}>
                    <label className="field">
                      من سورة:آية
                      <input
                        name={`start${i}`}
                        defaultValue={range.start}
                        required
                        pattern="[0-9]+:[0-9]+"
                        dir="ltr"
                        disabled={act.retracted}
                      />
                    </label>
                    <label className="field">
                      إلى سورة:آية
                      <input
                        name={`end${i}`}
                        defaultValue={range.end}
                        required
                        pattern="[0-9]+:[0-9]+"
                        dir="ltr"
                        disabled={act.retracted}
                      />
                    </label>
                  </div>
                ))}
                {!act.retracted && (
                  <>
                    <label className="field">
                      سبب التصحيح
                      <input name="reason" required maxLength={500} />
                    </label>
                    <p>
                      يبقى التصحيح في اليوم والأسبوع الأصليين ويحدّث مشاركات
                      المجتمع.
                    </p>
                    <div className="connected-actions">
                      <Button disabled={busy} value="correct">
                        حفظ التصحيح
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        value="retract"
                      >
                        سحب هذا الإدخال
                      </Button>
                    </div>
                  </>
                )}
              </form>
            ))
          ) : (
            <p>لا توجد إدخالات في هذا اليوم.</p>
          )
        }
      </RemoteState>
    </>
  );
}
