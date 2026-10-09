import { useState, useEffect, useRef } from "react";
import { useAccount } from "./connected/context.js";
import { AccountPage, ConnectedRoute } from "./connected/Pages.jsx";
import {
  Sun,
  BookOpen,
  Ship as ShipIcon,
  GraduationCap,
  Users,
  Settings,
  ArrowLeft,
  Menu,
  X,
  WifiOff,
  ShieldCheck,
  Check,
  RotateCcw,
  Info,
} from "lucide-react";
import { AppContext, navigate } from "./context.jsx";
import { STORAGE_KEY, initialState } from "./data/model.js";
import { Button, IconButton, Modal } from "./components/UI.jsx";
import { LogModal } from "./pages/Practice.jsx";
import { Today } from "./pages/Today.jsx";
import { Reader } from "./pages/Reader.jsx";
import { Journey } from "./pages/Journey.jsx";
import { LibraryPage, MediaDetail } from "./pages/Learning.jsx";
import { Classroom, Course, Lesson } from "./pages/Courses.jsx";
import { SettingsPage, Welcome } from "./pages/Community.jsx";
import { CommunityFeed } from "./pages/CommunityFeed.jsx";
import {
  meccaDay,
  nextMeccaMidnight,
  reconcileCheckins,
} from "./data/community.js";
const navigation = [
  ["today", "اليوم", Sun],
  ["reader", "المصحف", BookOpen],
  ["journey", "رحلتي", ShipIcon],
  ["classroom", "التعلّم", GraduationCap],
  ["community", "المجتمع", Users],
];
export default function App() {
  const account = useAccount();
  const [state, setState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved?.version === 1
        ? { ...initialState(), ...saved }
        : initialState();
    } catch {
      return initialState();
    }
  });
  const [currentDay, setCurrentDay] = useState(() => meccaDay());
  useEffect(() => {
    let timer;
    function syncDay() {
      clearTimeout(timer);
      const now = new Date();
      setCurrentDay(meccaDay(now));
      timer = setTimeout(
        syncDay,
        Math.max(100, nextMeccaMidnight(now) - now.getTime() + 50),
      );
    }
    syncDay();
    document.addEventListener("visibilitychange", syncDay);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", syncDay);
    };
  }, []);
  const [route, setRoute] = useState(location.hash.slice(2) || "today");
  const previousRoute = useRef(route);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const [quran, setQuran] = useState([]);
  const [quranError, setQuranError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [smallScreen, setSmallScreen] = useState(
    () => matchMedia("(max-width:700px)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(max-width:700px)");
    const changed = () => setSmallScreen(media.matches);
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    if (!menu || !smallScreen) return;
    const prior = document.activeElement;
    const sidebar = document.querySelector(".sidebar");
    sidebar.querySelector(".mobile-close")?.focus();
    const key = (event) => {
      if (event.key === "Escape") setMenu(false);
      if (event.key !== "Tab") return;
      const targets = [...sidebar.querySelectorAll("a, button")].filter(
        (el) => el.getBoundingClientRect().width,
      );
      const first = targets[0],
        last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
      prior?.focus?.();
    };
  }, [menu, smallScreen]);
  const update = (change) =>
    setState((prev) =>
      reconcileCheckins(
        prev,
        typeof change === "function" ? change(prev) : { ...prev, ...change },
      ),
    );
  const notify = (text, undo) => setToast({ text, undo, id: Date.now() });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    const f = () => {
      setRoute(location.hash.slice(2) || "today");
      setMenu(false);
      setModal(null);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const turningPage =
      route.startsWith("reader/") &&
      previousRoute.current.startsWith("reader/");
    if (!turningPage)
      document.querySelector("main")?.focus({ preventScroll: true });
    previousRoute.current = route;
  }, [route]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.undo ? 14000 : 7000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    let active = true;
    setQuranError(false);
    fetch("/data/quran.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (active) setQuran(d);
      })
      .catch(() => {
        if (active) setQuranError(true);
      });
    return () => {
      active = false;
    };
  }, [loadKey]);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "large-text",
      account.mode === "connected" ? account.me?.largeText : state.largeText,
    );
    document.documentElement.classList.toggle(
      "reduce-motion",
      account.mode === "connected"
        ? account.me?.reducedMotion
        : state.reducedMotion,
    );
  }, [state.largeText, state.reducedMotion, account.mode, account.me]);
  const page =
      { circles: "community", dhikr: "today" }[route.split("/")[0]] ||
      route.split("/")[0],
    id = route.split("/")[1];
  const value = {
    state,
    update,
    notify,
    setModal,
    quran,
    quranError,
    currentDay,
    retryQuran: () => setLoadKey((k) => k + 1),
  };
  const render = () => {
    if (page === "account") return <AccountPage />;
    if (account.mode === "connected")
      return <ConnectedRoute page={page} route={route} />;
    switch (page) {
      case "reader":
        return <Reader surahId={id} ayah={route.split("/")[2]} />;
      case "journey":
        return <Journey />;
      case "classroom":
        return <Classroom />;
      case "course":
        return <Course id={id} />;
      case "lesson":
        return (
          <Lesson
            key={route}
            courseId={route.split("/")[2] ? id : undefined}
            lessonId={route.split("/")[2]}
            legacyId={Number(id) || 1}
          />
        );
      case "library":
        return <LibraryPage />;
      case "media":
        return <MediaDetail id={id} />;
      case "community":
        return <CommunityFeed />;
      case "settings":
        return <SettingsPage />;
      case "welcome":
        return <Welcome />;
      default:
        return <Today />;
    }
  };
  return (
    <AppContext.Provider value={value}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector("main")?.focus();
        }}
      >
        انتقل إلى المحتوى
      </a>
      <div
        className={`app-shell ${page === "reader" ? "mushaf-shell" : page === "today" ? "today-shell" : page === "community" ? "community-shell" : ""}`}
      >
        <aside
          className={`sidebar ${menu ? "open" : ""}`}
          aria-label="القائمة الرئيسية"
          inert={smallScreen && !menu ? true : undefined}
          role={smallScreen && menu ? "dialog" : undefined}
          aria-modal={smallScreen && menu ? true : undefined}
        >
          <a className="brand" href="#/today">
            <span className="brand-mark">
              <ShipIcon strokeWidth={1.4} />
            </span>
            <span>
              <strong>سفينة النور</strong>
              <small>رحلةٌ تُبنى كل يوم</small>
            </span>
          </a>
          <IconButton
            label="إغلاق القائمة"
            className="mobile-close"
            onClick={() => setMenu(false)}
          >
            <X />
          </IconButton>
          <div className="nav-caption">مساحتك اليومية</div>
          <nav>
            {navigation.map(([key, label, Icon], i) => (
              <a
                key={key}
                className={`nav-item ${page === key || (key === "classroom" && ["lesson", "course", "library", "media"].includes(page)) ? "active" : ""} ${i === 4 ? "nav-divider" : ""}`}
                href={`#/${key}`}
                aria-current={
                  page === key ||
                  (key === "classroom" &&
                    ["course", "lesson", "library", "media"].includes(page))
                    ? "page"
                    : undefined
                }
              >
                <Icon size={20} strokeWidth={1.6} />
                <span>{label}</span>
                {key === "classroom" && <span className="tiny-dot" />}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <a
              className={`nav-item ${page === "settings" ? "active" : ""}`}
              href="#/settings"
            >
              <Settings size={19} />
              <span>الإعدادات</span>
            </a>
            <button className="profile" onClick={() => navigate("settings")}>
              <span className="avatar">ر</span>
              <span>
                <strong>
                  {account.mode === "connected"
                    ? account.me?.displayName || "حسابي"
                    : state.name}
                </strong>
                <small>
                  {account.mode === "connected"
                    ? "حساب متصل"
                    : "المعاينة المحلية"}
                </small>
              </span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </aside>
        {menu && (
          <button
            className="nav-backdrop"
            aria-label="إغلاق القائمة"
            onClick={() => setMenu(false)}
          />
        )}
        <div
          className="workspace"
          inert={smallScreen && menu ? true : undefined}
        >
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-btn mobile-menu"
                aria-label="فتح القائمة"
                onClick={() => setMenu(true)}
              >
                <Menu />
              </button>
              <span>مساحتك الخاصة</span>
              <span className="breadcrumb-line" />
              <strong>
                {navigation.find((n) => n[0] === page)?.[1] ||
                  {
                    settings: "الإعدادات",
                    lesson: "دوراتي",
                    course: "دوراتي",
                    media: "المكتبة",
                    library: "المكتبة",
                    welcome: "مرحبًا بك",
                  }[page] ||
                  "اليوم"}
              </strong>
            </div>
            {account.localPreviewEnabled &&
              (account.mode === "preview" ||
                account.session?.mode === "sandbox" ||
                account.me?.permissions?.superAdmin === true) && (
                <button
                  className="demo-badge"
                  onClick={() => {
                    account.chooseMode(
                      account.mode === "preview" ? "connected" : "preview",
                    );
                    if (
                      ![
                        "today",
                        "community",
                        "journey",
                        "classroom",
                        "library",
                      ].includes(page)
                    )
                      navigate("today");
                  }}
                >
                  {account.mode === "preview"
                    ? "فتح حساب الاختبار"
                    : "المعاينة الكاملة · أمثلة"}
                </button>
              )}
            <button className="demo-badge" onClick={() => navigate("account")}>
              <span />
              {account.mode === "connected"
                ? "حسابي"
                : "المعاينة · تسجيل الدخول"}
              <Info size={14} />
            </button>
          </header>
          {storageError && (
            <div className="status-banner" role="alert">
              تعذّر الحفظ على هذا الجهاز. اترك هذه الصفحة مفتوحة وصدّر بياناتك
              من الإعدادات.
            </div>
          )}
          {account.mode === "preview" && state.scenario === "offline" && (
            <div className="status-banner">
              <WifiOff size={17} />
              وضع اختبار دون اتصال · بياناتك محفوظة على هذا الجهاز فقط.
            </div>
          )}
          <main
            id="main-content"
            tabIndex={-1}
            key={page}
            className={`main-content ${page === "reader" ? "reader-main" : ""}`}
          >
            {render()}
          </main>
          <footer className="app-footer">
            <span>سفينة النور</span>
            <span>مساحة هادئة، وخطوة صادقة.</span>
            <button
              onClick={() =>
                account.mode === "connected"
                  ? navigate("account")
                  : setModal({ type: "demo" })
              }
            >
              {account.mode === "connected" ? "حسابي" : "عن هذه النسخة"}
            </button>
          </footer>
        </div>
        <nav
          className="bottom-nav"
          aria-label="تنقل الهاتف"
          inert={menu ? true : undefined}
        >
          {navigation.map(([key, label, Icon]) => (
            <a
              key={key}
              href={`#/${key}`}
              aria-current={
                page === key ||
                (key === "classroom" &&
                  ["course", "lesson", "library", "media"].includes(page))
                  ? "page"
                  : undefined
              }
              className={
                page === key ||
                (key === "classroom" &&
                  ["course", "lesson", "library", "media"].includes(page))
                  ? "active"
                  : ""
              }
            >
              <Icon size={21} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </div>
      {modal?.type === "log" && (
        <LogModal data={modal} onClose={() => setModal(null)} />
      )}
      {modal?.type === "demo" && (
        <Modal title="مساحتك لتجربة كل شيء" onClose={() => setModal(null)}>
          <div className="demo-intro">
            <ShieldCheck size={36} />
            <h3>جميع الميزات مفتوحة لك</h3>
            <p>
              جرّب القراءة، والدروس، والمجتمع دون تسجيل دخول أو دفع. هذه نسخة
              أمامية محلية؛ لا تُرسل بياناتك إلى أشخاص أو خدمات خارجية.
            </p>
          </div>
          <div className="info-box">
            أمثلة التاريخ والسفينة والمحتوى توضيحية. تسجيلك محفوظ في هذا
            المتصفح. لا يوجد تزامن أو منح رصيد حقيقي من الخادم.
          </div>
          <div className="modal-actions">
            <Button
              onClick={() => {
                setModal(null);
                navigate("settings");
              }}
            >
              لوحة الاختبار والإعدادات
              <ArrowLeft size={17} />
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)}>
              أكمل التجربة
            </Button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              onClick={() => {
                toast.undo();
                setToast(null);
              }}
            >
              <RotateCcw size={15} />
              تراجع
            </button>
          )}
          <IconButton label="إخفاء التنبيه" onClick={() => setToast(null)}>
            <X size={16} />
          </IconButton>
        </div>
      )}
    </AppContext.Provider>
  );
}
