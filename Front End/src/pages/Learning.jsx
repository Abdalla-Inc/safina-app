import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Play,
  Search,
  Bookmark,
  WifiOff,
} from "lucide-react";
import { useApp, ar, navigate } from "../context.jsx";
import {
  Button,
  Heading,
  MediaArtwork,
  SaveButton,
  DemoVideo,
  Empty,
} from "../components/UI.jsx";
import { media, searchMedia } from "../data/model.js";
import { LearningTabs } from "../components/LearningTabs.jsx";
export function LibraryPage() {
  const { state, update } = useApp();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("الكل");
  const [savedOnly, setSavedOnly] = useState(false);
  const matches = searchMedia(query, topic).filter(
    (m) => !savedOnly || state.saved.includes(m.id),
  );
  return (
    <>
      <LearningTabs active="library" />
      <div className="library-search">
        <Search size={23} />
        <input
          aria-label="ابحث في المكتبة"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في المكتبة"
        />
        <button
          className={`bookmark-filter ${savedOnly ? "active" : ""}`}
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly((v) => !v)}
        >
          <Bookmark size={19} />
          <span>المحفوظات</span>
        </button>
      </div>
      <div className="filter-chips" aria-label="تصنيفات المكتبة">
        {["الكل", "القرآن", "الذكر", "الاستمرارية", "الصحبة"].map((t) => (
          <button
            key={t}
            className={topic === t ? "active" : ""}
            aria-pressed={topic === t}
            onClick={() => setTopic(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="library-heading">
        <h2>
          {query
            ? `نتائج «${query}»`
            : savedOnly
              ? "ما احتفظت به"
              : "اختيارات للتأمّل"}
        </h2>
        <span>{ar(matches.length)} مواد تجريبية</span>
      </div>
      {state.scenario === "offline" && (
        <div className="info-box">
          <WifiOff size={16} />
          المقاطع التوضيحية محلية. المحتوى الخارجي سيحتاج اتصالًا عند ربط
          المكتبة.
        </div>
      )}
      {matches.length ? (
        <div className="media-grid">
          {matches.map((m) => (
            <article className="media-card" key={m.id}>
              <button
                className="media-open"
                onClick={() => navigate(`media/${m.id}`)}
                aria-label={`شاهد ${m.title}`}
              >
                <MediaArtwork tone={m.tone} />
                <span className="duration">{m.duration}</span>
              </button>
              <div className="media-card-copy">
                <div>
                  <span className="eyebrow">{m.topic} · مثال محلي</span>
                  <SaveButton
                    saved={state.saved.includes(m.id)}
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        saved: s.saved.includes(m.id)
                          ? s.saved.filter((x) => x !== m.id)
                          : [...s.saved, m.id],
                      }))
                    }
                  />
                </div>
                <button
                  className="title-link"
                  onClick={() => navigate(`media/${m.id}`)}
                >
                  <h3>{m.title}</h3>
                </button>
                <p>
                  {query
                    ? "مطابقة في العنوان أو الكلمات التجريبية"
                    : "مقطع مرئي توضيحي · متاح للجميع"}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="card">
          <Empty
            icon={Search}
            title="لم نجد مادة بهذا البحث"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setTopic("الكل");
                  setSavedOnly(false);
                }}
              >
                عرض جميع المواد
              </Button>
            }
          >
            جرّب كلمة أقصر مثل «استغفار»، أو أزل مرشّح المحفوظات. البحث هنا ضمن
            أربع عينات فقط.
          </Empty>
        </section>
      )}
    </>
  );
}
export function MediaDetail({ id }) {
  const { state, update } = useApp();
  const m = media.find((x) => x.id === id);
  if (!m)
    return (
      <Empty
        icon={BookOpen}
        title="هذه المادة غير متاحة"
        action={
          <Button onClick={() => navigate("library")}>العودة للمكتبة</Button>
        }
      >
        قد أُزيل المصدر أو تغيّر رابط المادة.
      </Empty>
    );
  const saved = state.saved.includes(m.id);
  return (
    <>
      <button
        className="text-btn back-link"
        onClick={() => navigate("library")}
      >
        <ArrowRight size={18} />
        المكتبة
      </button>
      <Heading
        eyebrow={`${m.topic} · مادة تجريبية متاحة للجميع`}
        title={m.title}
        action={
          <SaveButton
            saved={saved}
            onClick={() =>
              update((s) => ({
                ...s,
                saved: saved
                  ? s.saved.filter((x) => x !== m.id)
                  : [...s.saved, m.id],
              }))
            }
          />
        }
      />
      <div className="media-detail">
        <DemoVideo mediaKey={`library-${m.id}`} />
        <section className="card">
          <h3>عن هذه المادة</h3>
          <p>{m.description}</p>
          <dl className="source-details">
            <div>
              <dt>المصدر</dt>
              <dd>مشهد مرئي أُنشئ لهذه النسخة</dd>
            </div>
            <div>
              <dt>النص والكلمات</dt>
              <dd>عينة لاختبار البحث، وليست تفريغًا لحديث</dd>
            </div>
            <div>
              <dt>حقوق المقطع</dt>
              <dd>أصل محلي خاص بالنموذج</dd>
            </div>
            <div>
              <dt>المراجعة الدينية</dt>
              <dd>لا توجد مادة دينية تعليمية في المقطع</dd>
            </div>
          </dl>
          <h3>النص البديل للمقطع</h3>
          <p>
            مشهد هادئ بألوان خضراء ورملية. مدته اثنتا عشرة ثانية، دون صوت. يتيح
            تجربة الإيقاف والتقديم وسرعة التشغيل.
          </p>
          <button
            className="text-btn"
            onClick={() => {
              const video = document.querySelector("video");
              video.currentTime = 4;
              video.play().catch(() => {});
            }}
          >
            انتقل إلى الموضع التجريبي ٠:٠٤
            <Play size={17} />
          </button>
        </section>
      </div>
    </>
  );
}
