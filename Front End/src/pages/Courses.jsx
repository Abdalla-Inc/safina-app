import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  LockKeyhole,
  Play,
  Search,
  FileText,
  ListChecks,
  Bookmark,
  Unlock,
} from "lucide-react";
import { useApp, ar, navigate } from "../context.jsx";
import { Button, DemoVideo, Empty } from "../components/UI.jsx";
import {
  courses,
  courseById,
  lessonKey,
  moduleKey,
  lessonComplete,
  moduleComplete,
  canAccessModule,
  courseProgress,
  resumeLesson,
  lessonRoute,
  answersComplete,
} from "../data/courses.js";
import { LearningTabs } from "../components/LearningTabs.jsx";
function PreviewMode() {
  const { state, update } = useApp();
  return (
    <label className="course-preview">
      <Unlock size={15} />
      <select
        aria-label="وضع معاينة الدورات"
        value={state.learningMode || "founder"}
        onChange={(e) => update({ learningMode: e.target.value })}
      >
        <option value="founder">المؤسس · جميع الدروس مفتوحة</option>
        <option value="learner">معاينة الطالب · تعلّم بالتسلسل</option>
      </select>
    </label>
  );
}
function Crumbs({ course, lesson }) {
  return (
    <nav className="course-crumbs" aria-label="مسار الدورة">
      <a href="#/classroom">دوراتي</a>
      {course && (
        <>
          <span>/</span>
          <a
            href={`#/course/${course.id}`}
            aria-current={!lesson ? "page" : undefined}
          >
            {course.shortTitle}
          </a>
        </>
      )}
      {lesson && (
        <>
          <span>/</span>
          <span aria-current="page">{lesson.title}</span>
        </>
      )}
    </nav>
  );
}
function Progress({ value }) {
  return (
    <div className="course-meter">
      <div
        role="progressbar"
        aria-label="إكمال الدورة"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${value}%` }} />
      </div>
      <span>{ar(value)}٪</span>
    </div>
  );
}
export function Classroom() {
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const found = courses.filter(
    (c) =>
      c.title.includes(query.trim()) &&
      (filter === "all" ||
        (filter === "complete"
          ? courseProgress(state, c) === 100
          : courseProgress(state, c) < 100)),
  );
  return (
    <section className="courses-page">
      <LearningTabs active="courses" />
      <div className="course-topline">
        <h1>
          الدورات <span>{ar(courses.length)}</span>
        </h1>
        <PreviewMode />
      </div>
      <div className="course-toolbar">
        <div className="course-filters" aria-label="تصفية الدورات">
          {[
            ["all", "الكل"],
            ["active", "قيد التعلّم"],
            ["complete", "المكتملة"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="course-search">
          <Search size={18} />
          <input
            aria-label="البحث في دوراتي"
            placeholder="ابحث عن دورة"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="course-collection">
        {found.map((c) => (
          <article className="course-tile" key={c.id}>
            <a
              className="course-cover"
              href={`#/course/${c.id}`}
              aria-label={`فتح ${c.title}`}
            >
              <img src={c.thumbnail} alt="" />
              <span className="course-cover-badge">{c.badge}</span>
              <span className="cover-open">
                <ArrowLeft size={20} />
              </span>
            </a>
            <div className="course-tile-body">
              <div className="course-meta">
                {c.format}
                <span>•</span>
                {c.modules.length > 1
                  ? `${ar(c.modules.length)} أسابيع`
                  : "فيديو + أسئلة"}
              </div>
              <h2>
                <a href={`#/course/${c.id}`}>{c.title}</a>
              </h2>
              <Progress value={courseProgress(state, c)} />
              <div className="course-tile-actions">
                <a
                  className="course-start"
                  href={`#/${lessonRoute(c, resumeLesson(state, c))}`}
                >
                  <Play size={16} />
                  {courseProgress(state, c) === 100
                    ? "مراجعة الدورة"
                    : c.modules.some((m) =>
                          m.lessons.some((l) =>
                            lessonComplete(state, c.id, l.id),
                          ),
                        )
                      ? "متابعة التعلّم"
                      : "ابدأ التعلّم"}
                </a>
                <a href={`#/course/${c.id}`} className="course-outline-link">
                  عرض المحتوى <ArrowLeft size={16} />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!found.length && (
        <Empty
          icon={Search}
          title="لا توجد دورات هنا"
          children="جرّب بحثًا آخر أو اختر الكل."
        />
      )}
      <p className="course-footnote">
        نسخة تجريبية · العناوين والمقاطع والأسئلة عينات للتصميم.
      </p>
    </section>
  );
}
function Outline({ course, activeLesson, compact = false }) {
  const { state } = useApp();
  const activeIndex = course.modules.findIndex((m) =>
    m.lessons.some((l) => l.id === activeLesson),
  );
  return (
    <div className={`course-outline ${compact ? "compact" : ""}`}>
      {course.modules.map((m, index) => {
        const access = canAccessModule(state, course, index),
          done = moduleComplete(state, course, m);
        return (
          <details
            className={`course-module ${!access ? "locked" : ""}`}
            key={`${m.id}-${activeLesson || "overview"}`}
            open={index === (activeIndex < 0 ? 0 : activeIndex)}
          >
            <summary>
              <span className="module-status">
                {done ? (
                  <CheckCircle2 size={20} />
                ) : !access ? (
                  <LockKeyhole size={18} />
                ) : (
                  ar(index + 1)
                )}
              </span>
              <span className="module-name">
                <strong>{m.title}</strong>
                {!compact && <small>{m.subtitle}</small>}
              </span>
              <small>
                {ar(
                  m.lessons.filter((l) =>
                    lessonComplete(state, course.id, l.id),
                  ).length,
                )}
                /{ar(m.lessons.length)}
              </small>
              <ChevronDown size={17} />
            </summary>
            <div className="module-lessons">
              {!access && (
                <p className="locked-reason">
                  أكمل دروس الأسبوع السابق وأرسل إجاباته أولًا.
                </p>
              )}
              {m.lessons.map((l) => (
                <button
                  key={l.id}
                  className={`course-lesson-row ${activeLesson === l.id ? "selected" : ""}`}
                  aria-current={activeLesson === l.id ? "page" : undefined}
                  disabled={!access}
                  onClick={() => navigate(lessonRoute(course, l))}
                >
                  <img src={l.thumbnail} alt="" />
                  <span>
                    <strong>{l.title}</strong>
                    <small>فيديو · مقطع تجريبي</small>
                  </span>
                  {lessonComplete(state, course.id, l.id) ? (
                    <CheckCircle2 size={18} />
                  ) : !access ? (
                    <LockKeyhole size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                </button>
              ))}
              <div className="module-question-status">
                <ListChecks size={15} />
                <span>
                  {state.courseAnswers?.[moduleKey(course.id, m.id)]?.submitted
                    ? "تم إرسال الإجابات"
                    : "أسئلة نهاية " +
                      (course.modules.length > 1 ? "الأسبوع" : "المحاضرة")}
                </span>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
export function Course({ id }) {
  const { state } = useApp();
  const course = courseById(id);
  if (!course) return <Missing />;
  return (
    <section className="courses-page">
      <LearningTabs active="courses" />
      <div className="course-topline">
        <Crumbs course={course} />
        <PreviewMode />
      </div>
      <div className="course-overview">
        <div className="course-summary-cover">
          <img src={course.thumbnail} alt="" />
        </div>
        <div className="course-summary">
          <span className="course-meta">
            {course.format} · {course.badge}
          </span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <Progress value={courseProgress(state, course)} />
          <Button
            onClick={() =>
              navigate(lessonRoute(course, resumeLesson(state, course)))
            }
          >
            <Play size={17} />
            متابعة التعلّم
            <ArrowLeft size={17} />
          </Button>
        </div>
      </div>
      <div className="outline-heading">
        <h2>محتوى الدورة</h2>
        <span>{ar(course.modules.flatMap((m) => m.lessons).length)} درس</span>
      </div>
      <Outline course={course} />
      <p className="course-footnote">محتوى تجريبي لعرض التصميم.</p>
    </section>
  );
}
function Missing() {
  return (
    <div className="course-missing">
      <h1>المحتوى غير موجود</h1>
      <a href="#/classroom">العودة إلى دوراتي</a>
    </div>
  );
}
export function Lesson({ courseId, lessonId, legacyId }) {
  const { state, update, notify } = useApp();
  const course = courseById(courseId || "safina-vip");
  const resolvedId = lessonId || `lesson-${legacyId || 1}`;
  const moduleIndex =
    course?.modules.findIndex((m) =>
      m.lessons.some((l) => l.id === resolvedId),
    ) ?? -1;
  const module = course?.modules[moduleIndex];
  const lesson = module?.lessons.find((l) => l.id === resolvedId);
  const [tab, setTab] = useState(() =>
    module &&
    module.lessons.every((l) => lessonComplete(state, course.id, l.id)) &&
    !moduleComplete(state, course, module)
      ? "questions"
      : "notes",
  );
  const [error, setError] = useState("");
  if (!lesson) return <Missing />;
  const key = lessonKey(course.id, lesson.id),
    qkey = moduleKey(course.id, module.id);
  const record = state.courseLearning?.[key] || {};
  const answers = state.courseAnswers?.[qkey]?.answers || {};
  const submitted = Boolean(state.courseAnswers?.[qkey]?.submitted);
  const allViewed = module.lessons.every((l) =>
    lessonComplete(state, course.id, l.id),
  );
  const access = canAccessModule(state, course, moduleIndex);
  const flattened = course.modules.flatMap((m) => m.lessons);
  const next = flattened[flattened.findIndex((l) => l.id === lesson.id) + 1];
  const nextModuleIndex = next
    ? course.modules.findIndex((m) => m.lessons.some((l) => l.id === next.id))
    : -1;
  function changeRecord(change) {
    update((s) => ({
      ...s,
      courseLearning: {
        ...s.courseLearning,
        [key]: { ...s.courseLearning?.[key], ...change },
      },
    }));
  }
  function changeAnswer(id, value) {
    setError("");
    update((s) => ({
      ...s,
      courseAnswers: {
        ...s.courseAnswers,
        [qkey]: {
          answers: { ...s.courseAnswers?.[qkey]?.answers, [id]: value },
          submitted: false,
        },
      },
    }));
  }
  function submit(e) {
    e.preventDefault();
    if (!allViewed) {
      setError("أكمل جميع دروس هذه المرحلة قبل إرسال الإجابات.");
      return;
    }
    if (!answersComplete(module, answers)) {
      setError("أجب عن كل الأسئلة قبل الإرسال.");
      return;
    }
    update((s) => ({
      ...s,
      courseAnswers: {
        ...s.courseAnswers,
        [qkey]: { answers, submitted: true },
      },
    }));
    notify("حُفظت إجاباتك. اكتملت هذه المرحلة.");
  }
  return (
    <section className="courses-page">
      <LearningTabs active="courses" />
      <div className="course-topline">
        <Crumbs course={course} lesson={lesson} />
        <PreviewMode />
      </div>
      <div className="course-player-layout">
        <div className="course-player-main">
          {!access ? (
            <div className="course-locked-panel">
              <LockKeyhole size={34} />
              <h1>هذا الأسبوع لم يُفتح بعد</h1>
              <p>أكمل دروس الأسابيع السابقة وأرسل إجاباتها.</p>
              <Button
                onClick={() =>
                  navigate(lessonRoute(course, resumeLesson(state, course)))
                }
              >
                العودة إلى الدرس الحالي
                <ArrowLeft size={17} />
              </Button>
            </div>
          ) : (
            <>
              <DemoVideo
                key={key}
                mediaKey={key}
                poster={lesson.thumbnail}
                onEnded={() => changeRecord({ watched: true })}
              />
              <div className="course-lesson-heading">
                <div>
                  <span className="course-meta">{module.title}</span>
                  <h1>{lesson.title}</h1>
                </div>
                <button
                  className={`course-bookmark ${record.saved ? "saved" : ""}`}
                  aria-label="حفظ الدرس"
                  aria-pressed={!!record.saved}
                  onClick={() => changeRecord({ saved: !record.saved })}
                >
                  <Bookmark size={21} />
                </button>
              </div>
              <div className="course-completion-row">
                <Button
                  variant={record.completed ? "secondary" : undefined}
                  disabled={
                    !record.completed &&
                    state.learningMode === "learner" &&
                    !record.watched
                  }
                  onClick={() => {
                    changeRecord({ completed: !record.completed });
                    if (
                      !record.completed &&
                      module.lessons.every(
                        (l) =>
                          l.id === lesson.id ||
                          lessonComplete(state, course.id, l.id),
                      )
                    )
                      setTab("questions");
                    if (!record.completed)
                      notify(
                        "اكتمل الدرس. أجب عن الأسئلة بعد إكمال دروس هذه المرحلة.",
                      );
                  }}
                >
                  {record.completed ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  {record.completed ? "مكتمل · تراجع" : "أكملت الدرس"}
                </Button>
                <span>
                  {!record.completed &&
                  state.learningMode === "learner" &&
                  !record.watched
                    ? "شاهد المقطع كاملًا لإكمال الدرس."
                    : record.completed
                      ? "محفوظ على هذا الجهاز"
                      : ""}
                </span>
              </div>
              <div className="course-panel-tabs" aria-label="خيارات الدرس">
                <button
                  aria-pressed={tab === "notes"}
                  onClick={() => setTab("notes")}
                >
                  <FileText size={17} />
                  ملاحظاتي
                </button>
                <button
                  aria-pressed={tab === "questions"}
                  onClick={() => setTab("questions")}
                >
                  <ListChecks size={17} />
                  أسئلة {course.modules.length > 1 ? "الأسبوع" : "المحاضرة"}
                  {submitted && <Check size={15} />}
                </button>
              </div>
              <div className="course-workspace">
                {tab === "notes" ? (
                  <label className="field">
                    <span>ملاحظات خاصة · تُحفظ تلقائيًا</span>
                    <textarea
                      rows="5"
                      aria-label="ملاحظاتي على الدرس"
                      placeholder="اكتب فكرة تريد العودة إليها…"
                      value={
                        record.note ??
                        (course.id === "safina-vip"
                          ? state.notes?.[Number(lesson.id.split("-")[1])]
                          : "") ??
                        ""
                      }
                      onChange={(e) => changeRecord({ note: e.target.value })}
                    />
                  </label>
                ) : (
                  <form onSubmit={submit}>
                    <p className="course-question-intro">
                      {submitted
                        ? "تم إرسال الإجابات محليًا. تعديلها يتطلّب إرسالها مرة أخرى."
                        : course.modules.length > 1
                          ? "أكمل الدروس ثم أجب لفتح الأسبوع التالي."
                          : "أكمل المحاضرة ثم أجب لإكمال الدورة."}
                    </p>
                    {module.questions.map((q, i) => (
                      <fieldset className="course-question" key={q.id}>
                        <legend>
                          {ar(i + 1)}. {q.label}
                        </legend>
                        {q.type === "text" ? (
                          <textarea
                            aria-label={q.label}
                            rows="3"
                            value={answers[q.id] || ""}
                            onChange={(e) => changeAnswer(q.id, e.target.value)}
                          />
                        ) : (
                          q.options.map((o) => (
                            <label className="course-radio" key={o}>
                              <input
                                type="radio"
                                name={q.id}
                                value={o}
                                checked={answers[q.id] === o}
                                onChange={() => changeAnswer(q.id, o)}
                              />
                              {o}
                            </label>
                          ))
                        )}
                      </fieldset>
                    ))}
                    {error && (
                      <p role="alert" className="course-form-error">
                        {error}
                      </p>
                    )}
                    {!allViewed && (
                      <p className="course-form-hint">
                        باقي الدروس:{" "}
                        {ar(
                          module.lessons.filter(
                            (l) => !lessonComplete(state, course.id, l.id),
                          ).length,
                        )}
                      </p>
                    )}
                    <Button type="submit" disabled={submitted || !allViewed}>
                      {submitted ? (
                        <Check size={17} />
                      ) : (
                        <ArrowLeft size={17} />
                      )}
                      {submitted ? "تم إرسال الإجابات" : "إرسال الإجابات"}
                    </Button>
                  </form>
                )}
              </div>
              <div className="course-next">
                {next ? (
                  <>
                    <span>
                      {!canAccessModule(state, course, nextModuleIndex)
                        ? "أكمل الدروس وأرسل الإجابات للمتابعة."
                        : "الدرس التالي"}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={
                        !canAccessModule(state, course, nextModuleIndex)
                      }
                      onClick={() => navigate(lessonRoute(course, next))}
                    >
                      {next.title}
                      <ArrowLeft size={17} />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`course/${course.id}`)}
                  >
                    العودة إلى الدورة
                    <ArrowRight size={17} />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
        <aside className="course-player-outline">
          <a className="player-course-name" href={`#/course/${course.id}`}>
            <img src={course.thumbnail} alt="" />
            <span>
              {course.shortTitle}
              <small>{course.format}</small>
            </span>
          </a>
          <Progress value={courseProgress(state, course)} />
          <Outline course={course} activeLesson={lesson.id} compact />
        </aside>
      </div>
    </section>
  );
}
