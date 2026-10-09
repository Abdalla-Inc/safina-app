import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { useApp, ar, navigate } from "../context.jsx";
import { Button, IconButton, Modal } from "../components/UI.jsx";
import { matchingSurahs, normalizeQuranSearch } from "../data/reader.js";
import {
  MUSHAF_EDITION,
  PAGE_COUNT,
  juzPages,
  pageDetails,
  pageForVerse,
  pageImage,
  surahPages,
  swipePageDelta,
  validPage,
  versesOnPage,
} from "../data/mushaf.js";
import "./Reader.css";

export function Reader({ surahId, ayah }) {
  const { state, update, quran, quranError, retryQuran } = useApp();
  const page =
    surahId === "page"
      ? validPage(ayah)
      : surahId
        ? pageForVerse(surahId, ayah || 1)
        : null;
  const isIndex = !surahId;
  const [chrome, setChrome] = useState(true);
  const [tab, setTab] = useState("surah");
  const [query, setQuery] = useState("");
  const [more, setMore] = useState(false);
  const [jump, setJump] = useState("");
  const [jumpError, setJumpError] = useState(false);
  const [imageState, setImageState] = useState({
    page: null,
    status: "loading",
  });
  const [retry, setRetry] = useState(0);
  const surface = useRef(null);
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const pointers = useRef(new Set());
  const details = pageDetails(page);
  const title = quran.find((s) => s.id === details?.surah)?.name || "المصحف";
  const savedPages = state.mushafBookmarks || [];
  const bookmarked = savedPages.includes(page);
  const resumePage =
    validPage(state.reader.page) ||
    pageForVerse(state.reader.surah, state.reader.from) ||
    1;
  const pageVerses = useMemo(() => versesOnPage(quran, page), [quran, page]);
  const status = imageState.page === page ? imageState.status : "loading";

  useEffect(() => {
    // Preserve bookmarks made in the previous verse-based reader.
    if (state.mushafBookmarks === undefined) {
      const migrated = [
        ...new Set(
          (state.quranBookmarks || [])
            .map((ref) => pageForVerse(...ref.split(":")))
            .filter(validPage),
        ),
      ];
      update((s) => ({ ...s, mushafBookmarks: s.mushafBookmarks ?? migrated }));
    }
  }, []);

  useEffect(() => {
    if (!page) return;
    const first = pageDetails(page);
    update((s) => ({
      ...s,
      reader: {
        ...s.reader,
        page,
        edition: MUSHAF_EDITION,
        surah: first.surah,
        from: first.verse,
      },
    }));
    // Adjacent leaves are local assets; only these two are prefetched.
    [page - 1, page + 1].filter(validPage).forEach((p) => {
      const image = new Image();
      image.src = pageImage(p);
    });
  }, [page]);

  useEffect(() => {
    if (isIndex) setChrome(true);
    setMore(false);
    gesture.current = null;
    pointers.current.clear();
  }, [page, isIndex]);

  function openPage(next) {
    if (validPage(next)) navigate(`reader/page/${next}`);
  }
  function turn(delta) {
    if (page && validPage(page + delta)) openPage(page + delta);
  }
  useEffect(() => {
    if (!page || more) return;
    function key(event) {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target.closest("input, select, textarea, dialog")
      )
        return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        turn(event.key === "ArrowRight" ? 1 : -1);
      }
      if (event.key === "Escape") setChrome(true);
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [page, more]);

  function toggleChrome(event) {
    if (suppressClick.current && event.detail !== 0) {
      suppressClick.current = false;
      return;
    }
    suppressClick.current = false;
    setChrome((shown) => !shown);
  }
  function pointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointers.current.add(event.pointerId);
    suppressClick.current = false;
    if (pointers.current.size > 1 || !event.isPrimary) {
      gesture.current = null;
      suppressClick.current = true;
      return;
    }
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerUp(event) {
    pointers.current.delete(event.pointerId);
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) suppressClick.current = true;
    const delta = swipePageDelta(dx, dy);
    if (delta) turn(delta);
  }
  function cancelPointer(event) {
    pointers.current.delete(event.pointerId);
    gesture.current = null;
    suppressClick.current = true;
  }
  function bookmark() {
    update((s) => ({
      ...s,
      mushafBookmarks: (s.mushafBookmarks || []).includes(page)
        ? s.mushafBookmarks.filter((p) => p !== page)
        : [...(s.mushafBookmarks || []), page],
    }));
  }
  const closeButton = (
    <IconButton label="الخروج من المصحف" onClick={() => navigate("today")}>
      <ArrowRight size={22} />
    </IconButton>
  );

  if (quranError || !quran.length || (!isIndex && !page))
    return (
      <section className="mushaf-unavailable">
        {closeButton}
        <p role="status">
          {quranError
            ? "تعذّر تحميل الفهرس"
            : !quran.length
              ? "جارٍ تحميل المصحف…"
              : "الصفحة غير موجودة"}
        </p>
        {quranError ? (
          <Button onClick={retryQuran}>إعادة المحاولة</Button>
        ) : (
          quran.length > 0 && (
            <Button onClick={() => navigate("reader")}>الفهرس</Button>
          )
        )}
      </section>
    );

  if (isIndex) {
    const listed = matchingSurahs(quran, query);
    const q = normalizeQuranSearch(query);
    return (
      <section className="mushaf-index" aria-label="فهرس المصحف">
        <header className="mushaf-index-header">
          {closeButton}
          <h1>المصحف</h1>
          <IconButton
            label="علامات الصفحات"
            aria-pressed={tab === "saved"}
            onClick={() => {
              setTab(tab === "saved" ? "surah" : "saved");
              setQuery("");
            }}
          >
            <Bookmark size={21} />
          </IconButton>
        </header>
        <div className="mushaf-index-content">
          <button
            className="mushaf-resume"
            onClick={() => openPage(resumePage)}
          >
            <BookOpen size={21} strokeWidth={1.5} />
            <span>
              <small>آخر موضع</small>
              <strong>
                {
                  quran.find((s) => s.id === pageDetails(resumePage).surah)
                    ?.name
                }
              </strong>
            </span>
            <span className="mushaf-index-page">{ar(resumePage)}</span>
            <ChevronLeft size={17} />
          </button>
          <div className="mushaf-index-switch" aria-label="تصفّح المصحف">
            <button
              aria-pressed={tab === "surah"}
              onClick={() => {
                setTab("surah");
                setQuery("");
              }}
            >
              السور
            </button>
            <button
              aria-pressed={tab === "juz"}
              onClick={() => {
                setTab("juz");
                setQuery("");
              }}
            >
              الأجزاء
            </button>
          </div>
          {tab !== "saved" && (
            <label className="mushaf-search">
              <Search size={18} />
              <input
                aria-label={tab === "surah" ? "ابحث عن سورة" : "ابحث عن جزء"}
                placeholder={tab === "surah" ? "ابحث عن سورة" : "رقم الجزء"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          )}
          {tab === "saved" && (
            <h2 className="mushaf-saved-title">علامات الصفحات</h2>
          )}
          <div className="mushaf-index-rows">
            {tab === "surah" &&
              listed.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openPage(surahPages[s.id - 1])}
                  aria-label={`${s.name}، صفحة ${ar(surahPages[s.id - 1])}`}
                >
                  <span className="mushaf-row-number">{ar(s.id)}</span>
                  <span className="mushaf-row-name">
                    <strong>{s.name}</strong>
                    <small>{ar(s.total_verses)} آية</small>
                  </span>
                  <span className="mushaf-index-page">
                    {ar(surahPages[s.id - 1])}
                  </span>
                </button>
              ))}
            {tab === "juz" &&
              juzPages
                .map((p, i) => ({ p, i }))
                .filter(({ i }) => !q || String(i + 1).includes(q))
                .map(({ p, i }) => (
                  <button
                    key={i}
                    onClick={() => openPage(p)}
                    aria-label={`الجزء ${ar(i + 1)}، صفحة ${ar(p)}`}
                  >
                    <span className="mushaf-row-number">{ar(i + 1)}</span>
                    <span className="mushaf-row-name">
                      <strong>الجزء {ar(i + 1)}</strong>
                      <small>
                        {quran.find((s) => s.id === pageDetails(p).surah)?.name}
                      </small>
                    </span>
                    <span className="mushaf-index-page">{ar(p)}</span>
                  </button>
                ))}
            {tab === "saved" &&
              [...savedPages]
                .filter(validPage)
                .sort((a, b) => a - b)
                .map((p) => (
                  <button key={p} onClick={() => openPage(p)}>
                    <Bookmark size={19} />
                    <span className="mushaf-row-name">
                      <strong>
                        {quran.find((s) => s.id === pageDetails(p).surah)?.name}
                      </strong>
                      <small>الجزء {ar(pageDetails(p).juz)}</small>
                    </span>
                    <span className="mushaf-index-page">{ar(p)}</span>
                  </button>
                ))}
          </div>
          {((tab === "surah" && !listed.length) ||
            (tab === "juz" &&
              !juzPages.some((_, i) => !q || String(i + 1).includes(q)))) && (
            <p className="mushaf-index-empty" role="status">
              لا توجد نتائج
            </p>
          )}
          {tab === "saved" && !savedPages.length && (
            <p className="mushaf-index-empty">لا توجد علامات بعد</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`mushaf-reader ${chrome ? "controls-visible" : "controls-hidden"}`}
      aria-label={`المصحف، صفحة ${ar(page)}`}
    >
      <div className="mushaf-paper">
        <div className="mushaf-running-head" aria-hidden="true">
          <span>{title}</span>
          <span>الجزء {ar(details.juz)}</span>
        </div>
        <button
          ref={surface}
          className="mushaf-page-surface"
          aria-label={chrome ? "إخفاء أدوات القراءة" : "إظهار أدوات القراءة"}
          aria-pressed={!chrome}
          onClick={toggleChrome}
          onPointerDown={pointerDown}
          onPointerUp={pointerUp}
          onPointerCancel={cancelPointer}
        >
          <img
            key={`${page}-${retry}`}
            src={`${pageImage(page)}${retry ? `?retry=${retry}` : ""}`}
            alt=""
            draggable="false"
            width="1260"
            height="2038"
            className={
              status === "ready"
                ? "mushaf-page-image ready"
                : "mushaf-page-image"
            }
            onLoad={() => setImageState({ page, status: "ready" })}
            onError={() => setImageState({ page, status: "error" })}
          />
        </button>
        {status !== "ready" && (
          <div className="mushaf-image-status" role="status">
            {status === "error" ? (
              <>
                <p>تعذّر تحميل الصفحة</p>
                <Button
                  onClick={() => {
                    setImageState({ page, status: "loading" });
                    setRetry((r) => r + 1);
                  }}
                >
                  إعادة المحاولة
                </Button>
                <button className="text-btn" onClick={() => navigate("reader")}>
                  الفهرس
                </button>
              </>
            ) : (
              <span>جارٍ تحميل الصفحة…</span>
            )}
          </div>
        )}
        <div className="mushaf-folio" aria-hidden="true">
          {ar(page)}
        </div>
      </div>
      <header
        className="mushaf-controls mushaf-reader-header"
        inert={!chrome ? true : undefined}
        aria-hidden={!chrome}
      >
        <IconButton
          label="فهرس السور والأجزاء"
          onClick={() => navigate("reader")}
        >
          <ArrowRight size={22} />
        </IconButton>
        <button
          className="mushaf-header-title"
          onClick={() => navigate("reader")}
        >
          <strong>{title}</strong>
          <small>
            صفحة {ar(page)} · الجزء {ar(details.juz)}
          </small>
        </button>
        <div className="mushaf-header-actions">
          <IconButton
            label={bookmarked ? "إزالة علامة الصفحة" : "وضع علامة للصفحة"}
            aria-pressed={bookmarked}
            onClick={bookmark}
          >
            <Bookmark size={21} fill={bookmarked ? "currentColor" : "none"} />
          </IconButton>
          <IconButton
            label="خيارات المصحف"
            onClick={() => {
              setJump(String(page));
              setJumpError(false);
              setMore(true);
            }}
          >
            <MoreHorizontal size={22} />
          </IconButton>
        </div>
      </header>
      <nav
        className="mushaf-controls mushaf-page-nav"
        aria-label="صفحات المصحف"
        inert={!chrome ? true : undefined}
        aria-hidden={!chrome}
      >
        <IconButton
          label="الصفحة التالية"
          disabled={page === PAGE_COUNT}
          onClick={() => turn(1)}
        >
          <ChevronRight size={22} />
        </IconButton>
        <button
          className="mushaf-page-number"
          aria-label="انتقل إلى صفحة"
          onClick={() => {
            setJump(String(page));
            setJumpError(false);
            setMore(true);
          }}
        >
          <bdi>{ar(page)}</bdi>
          <span>/</span>
          <span>
            <bdi>{ar(PAGE_COUNT)}</bdi>
          </span>
        </button>
        <IconButton
          label="الصفحة السابقة"
          disabled={page === 1}
          onClick={() => turn(-1)}
        >
          <ChevronLeft size={22} />
        </IconButton>
      </nav>
      <span className="mushaf-sr-only" role="status" aria-live="polite">
        {title}، صفحة {ar(page)}، الجزء {ar(details.juz)}
      </span>
      <article className="mushaf-sr-only" aria-label={`نص الصفحة ${ar(page)}`}>
        {pageVerses.map((v) => (
          <p key={`${v.surah}:${v.id}`}>
            {v.text} ﴿{ar(v.id)}﴾
          </p>
        ))}
      </article>
      {more && (
        <Modal title="المصحف" onClose={() => setMore(false)}>
          <form
            className="mushaf-jump-form"
            onSubmit={(e) => {
              e.preventDefault();
              const p = validPage(normalizeQuranSearch(jump));
              if (p) {
                setMore(false);
                openPage(p);
              } else setJumpError(true);
            }}
          >
            <label htmlFor="mushaf-page-jump">انتقل إلى صفحة</label>
            <div>
              <input
                id="mushaf-page-jump"
                inputMode="numeric"
                value={jump}
                aria-invalid={jumpError || undefined}
                aria-describedby={jumpError ? "mushaf-jump-error" : undefined}
                onChange={(e) => {
                  setJump(e.target.value);
                  setJumpError(false);
                }}
              />
              <Button type="submit">انتقل</Button>
            </div>
            {jumpError && (
              <p id="mushaf-jump-error" role="alert">
                أدخل رقمًا من ١ إلى ٦٠٤
              </p>
            )}
          </form>
          <button
            className="mushaf-menu-row"
            onClick={() => {
              setMore(false);
              navigate("reader");
            }}
          >
            <BookOpen size={19} />
            السور والأجزاء
          </button>
          <button
            className="mushaf-menu-row"
            onClick={() => {
              setMore(false);
              navigate("today");
            }}
          >
            <X size={19} />
            الخروج من المصحف
          </button>
          <details className="mushaf-source">
            <summary>عن المصحف</summary>
            <p>مصحف المدينة · حفص · ٦٠٤ صفحات</p>
            <p>
              صور الصفحات الأصلية من{" "}
              <a
                href="https://android.quran.com/"
                target="_blank"
                rel="noreferrer"
              >
                Quran Android
              </a>
              ، الإصدار الثامن. الخط والصفحات لمجمع الملك فهد لطباعة المصحف
              الشريف.
            </p>
            <p>
              النص المتاح لقارئ الشاشة:{" "}
              <a href="/licenses/quran-json-README.md">Quran JSON 3.1.2</a> ·{" "}
              <a href="/licenses/quran-json-LICENSE.txt">CC BY-SA 4.0</a>.
            </p>
          </details>
        </Modal>
      )}
    </section>
  );
}
