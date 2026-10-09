import { CommunityAyah } from "../components/CommunityAyah.jsx";
import { ReactionBar } from "../components/ReactionBar.jsx";
import { CountryBadge } from "../components/DailyPreferences.jsx";
import { useMemo, useState } from "react";
import {
  Heart,
  Check,
  BookOpen,
  Users,
  Camera,
  Sparkles,
  Pause,
  ChevronDown,
} from "lucide-react";
import { useApp, ar } from "../context.jsx";
import { ProfileAvatar } from "../components/ProfilePhoto.jsx";
import { checkinPalette, checkinTier } from "../data/communityLevels.js";
import {
  COMMUNITY_ZONE,
  COMMUNITY_MEMBER,
  dailyCheckins,
  completedPeople,
  exampleCheckins,
} from "../data/community.js";
import {
  readingWeek,
  weekLabel,
  ownReadingWeeks,
  exampleCelebration,
  exampleOwnWeeks,
} from "../data/communityWeeks.js";
import "./CommunityFeed.css";

function ReadingCard({ post, history = false }) {
  const { state } = useApp();
  const palette = checkinPalette(post);
  const own = post.memberId === COMMUNITY_MEMBER;
  return (
    <article
      className={`checkin-card ${post.weekly ? "weekly-card" : ""}`}
      aria-label={`${post.weekly ? "حصاد" : "قراءة"} ${post.name}`}
      data-level={checkinTier(post)}
      style={{
        "--level-accent": palette.accent,
        "--level-tint": palette.tint,
        "--level-line": palette.line,
      }}
    >
      <div className="checkin-author">
        <ProfileAvatar
          src={own ? state.profilePhoto : post.avatar}
          name={post.name}
        />
        <div className="checkin-identity">
          <h2>
            {post.name}
            <CountryBadge code={own ? state.countryCode : post.countryCode} />
            {own && !state.countryCode && (
              <a className="country-prompt" href="#/settings">
                أضف بلدك
              </a>
            )}
            <small>{post.example ? "مثال" : own ? "أنت" : ""}</small>
          </h2>
          {post.weekly ? (
            <span className="weekly-card-subtitle">
              {post.readingDays === 0
                ? `${ar(post.activityDays || 0)} أيام من الذكر`
                : post.readingDays === 1
                  ? "يوم مع القرآن"
                  : post.readingDays === 2
                    ? "يومان مع القرآن"
                    : `${ar(post.readingDays)} أيام مع القرآن`}
            </span>
          ) : (
            <time dateTime={post.updatedAt}>
              {new Intl.DateTimeFormat("ar-EG", {
                timeZone: COMMUNITY_ZONE,
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(post.updatedAt))}
            </time>
          )}
        </div>
        <span
          className="checkin-level-mark"
          title={palette.label}
          aria-label={`الالتزام: ${palette.label}`}
        >
          <span />
          <span />
          <span />
        </span>
      </div>
      <div className="checkin-reading">
        <span>{post.weekly ? "حصاد الأسبوع" : "ورد اليوم"}</span>
        <ul>
          {post.tasks.map((task, i) => (
            <li key={`${task.surah || "reading"}-${i}`}>
              {!post.weekly && i > 0 && (
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
      {(post.levels?.length > 1 || post.previousTier) && (
        <p className="weekly-level-change">
          {post.previousTier ? "تغيّر الالتزام" : "تغيّر الالتزام خلال الأسبوع"}{" "}
          <span>
            {[
              ...new Set(
                [post.previousTier, ...(post.levels || [])].filter(Boolean),
              ),
            ].map((level) => (
              <i
                key={level}
                style={{
                  background: checkinPalette({ tierAtCompletion: level })
                    .accent,
                }}
                title={checkinPalette({ tierAtCompletion: level }).label}
              />
            ))}
          </span>
        </p>
      )}
      <div className="checkin-bottom">
        <span>
          {post.weekly ? (
            <Sparkles size={15} aria-hidden="true" />
          ) : (
            post.complete && <Check size={15} aria-hidden="true" />
          )}
          {post.weekly
            ? "نحتفي بكل خطوة"
            : post.complete
              ? "ورد اليوم مكتمل"
              : "من ورد اليوم"}
        </span>
        <ReactionBar post={post} />
      </div>
      {history && post.days && (
        <details className="weekly-days">
          <summary>
            أوراد الأسبوع <ChevronDown size={15} aria-hidden="true" />
          </summary>
          <div>
            {post.days.map((day) => {
              const dailyPost =
                !post.example &&
                state.communityCheckins?.find(
                  (p) => p.day === day.date && p.memberId === COMMUNITY_MEMBER,
                );
              return (
                <section
                  className="weekly-day"
                  key={day.date}
                  aria-label={`ورد ${day.date}`}
                >
                  <time dateTime={day.date}>
                    {new Intl.DateTimeFormat("ar-EG", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: COMMUNITY_ZONE,
                    }).format(new Date(`${day.date}T12:00:00+03:00`))}
                  </time>
                  {day.items.map((item, i) => (
                    <div className="weekly-day-reading" key={i}>
                      <span
                        className="weekly-day-dot"
                        style={{ background: checkinPalette(item).accent }}
                        title={checkinPalette(item).label}
                      />
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {item.kind === "istighfar"
                            ? `${ar(item.count)} مرة`
                            : item.complete
                              ? "قراءة كاملة"
                              : `${ar(item.count)} من ${ar(item.total)} آية`}
                        </small>
                      </div>
                      {item.complete && <Check size={14} aria-label="مكتمل" />}
                      {item.levels?.length > 1 && (
                        <small>التزامان في هذا اليوم</small>
                      )}
                    </div>
                  ))}
                  {dailyPost && (
                    <div className="weekly-day-reaction">
                      <ReactionBar post={dailyPost} />
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </details>
      )}
    </article>
  );
}
export function CelebrationConfetti({ enabled }) {
  if (!enabled) return null;
  return (
    <div className="celebration-confetti" aria-hidden="true">
      {Array.from({ length: 32 }, (_, i) => (
        <i
          key={i}
          style={{
            "--x": `${(i * 31 + 7) % 100}%`,
            "--delay": `${-(i % 13)}s`,
            "--duration": `${10 + (i % 7)}s`,
            "--drift": `${(i % 2 ? 1 : -1) * (20 + (i % 40))}px`,
            "--confetti-color": ["#c6a963", "#8dab96", "#b39cc9", "#b0bfcd"][
              i % 4
            ],
          }}
        />
      ))}
    </div>
  );
}

export function CommunityFeed() {
  const { state, update, quran, currentDay, quranError, retryQuran } = useApp();
  const [examples, setExamples] = useState(true);
  const [mine, setMine] = useState(false);
  const [weeklyOverride, setWeeklyOverride] = useState(null);
  const week = readingWeek(currentDay);
  const weekly =
    weeklyOverride?.day === currentDay ? weeklyOverride.value : week.saturday;
  const celebrating = weekly && !mine;
  const samples = useMemo(() => exampleCheckins(currentDay), [currentDay]);
  const myWeeks = useMemo(
    () => ownReadingWeeks(state, quran, currentDay),
    [
      state.entries,
      state.istighfarDays,
      state.name,
      state.countryCode,
      quran,
      currentDay,
    ],
  );
  const history = [
    ...myWeeks.map((post, i) => ({
      ...post,
      previousTier:
        myWeeks[i + 1]?.tierAtCompletion &&
        myWeeks[i + 1].tierAtCompletion !== post.tierAtCompletion
          ? myWeeks[i + 1].tierAtCompletion
          : null,
    })),
    ...(examples ? exampleOwnWeeks(currentDay) : []),
  ].sort(
    (a, b) =>
      b.weekStart.localeCompare(a.weekStart) ||
      Number(a.example || false) - Number(b.example || false),
  );
  const historyStarts = [...new Set(history.map((p) => p.weekStart))];
  const weeklyPosts = [
    ...myWeeks.filter((p) => p.weekStart === week.start),
    ...(examples ? exampleCelebration(week.start) : []),
  ];
  const dailyPosts = dailyCheckins(
    [...(state.communityCheckins || []), ...(examples ? samples : [])],
    currentDay,
  );
  const visiblePosts = celebrating ? weeklyPosts : dailyPosts;
  const count = celebrating
    ? new Set(weeklyPosts.map((p) => p.memberId)).size
    : completedPeople(dailyPosts, currentDay);
  const motion = state.communityConfetti !== false && !state.reducedMotion;
  const dateLabel = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: COMMUNITY_ZONE,
  }).format(new Date(`${currentDay}T12:00:00+03:00`));
  return (
    <section
      className={`community-page ${celebrating ? "community-celebrating" : ""}`}
      aria-label="مجتمع القراءة"
    >
      <CelebrationConfetti enabled={celebrating && motion} />
      <div className="community-date">
        <time dateTime={currentDay}>{dateLabel}</time>
        <span>بتوقيت مكة</span>
        <a
          className="community-profile"
          href="#/settings"
          aria-label="الصورة الشخصية والإعدادات"
          title="الصورة الشخصية"
        >
          {state.profilePhoto ? (
            <ProfileAvatar src={state.profilePhoto} name={state.name} />
          ) : (
            <Camera size={19} />
          )}
        </a>
      </div>
      {!mine && (
        <>
          <CommunityAyah
            day={currentDay}
            weekStart={week.start}
            weekly={celebrating}
          />
          <header className="community-count">
            {celebrating ? (
              <Sparkles size={23} strokeWidth={1.4} aria-hidden="true" />
            ) : (
              <Users size={23} strokeWidth={1.4} aria-hidden="true" />
            )}
            <div aria-live="polite">
              <strong>{ar(count)}</strong>
              <span>
                {celebrating
                  ? "نحتفي بجهودهم هذا الأسبوع"
                  : "أتمّوا وردهم اليوم"}
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
          <button aria-pressed={!mine} onClick={() => setMine(false)}>
            الجميع
          </button>
          <button aria-pressed={mine} onClick={() => setMine(true)}>
            أورادي
          </button>
        </div>
        {!mine && (
          <button
            className={`community-week-toggle ${weekly ? "selected" : ""}`}
            aria-pressed={weekly}
            onClick={() =>
              setWeeklyOverride({ day: currentDay, value: !weekly })
            }
          >
            <Sparkles size={14} aria-hidden="true" />
            {weekly
              ? "عرض اليوم"
              : week.saturday
                ? "احتفال الأسبوع"
                : "معاينة السبت"}
          </button>
        )}
      </div>
      <div className="community-preview-row">
        <p className="community-preview">
          معاينة محلية{examples && " · «مثال» بيانات توضيحية"}
        </p>
        <button
          className="community-examples-toggle"
          aria-pressed={examples}
          onClick={() => setExamples((v) => !v)}
        >
          {examples ? "إخفاء الأمثلة" : "عرض أمثلة"}
        </button>
      </div>
      {celebrating && (
        <div className="celebration-caption">
          <div>
            <strong>حصاد الأسبوع</strong>
            <span>{weekLabel(week.start)}</span>
          </div>
          {!state.reducedMotion && (
            <button
              className="celebration-motion-toggle"
              onClick={() => update({ communityConfetti: !motion })}
              aria-pressed={motion}
              aria-label={motion ? "إيقاف الحركة" : "تشغيل الحركة"}
              title={motion ? "إيقاف الحركة" : "تشغيل الحركة"}
            >
              {motion ? <Pause size={17} /> : <Sparkles size={17} />}
            </button>
          )}
        </div>
      )}
      {mine ? (
        <div className="weekly-history" aria-label="أورادي حسب الأسبوع">
          {quranError ? (
            <div className="weekly-source-status" role="status">
              تعذّر تحميل قراءاتك.{" "}
              <button onClick={retryQuran}>إعادة المحاولة</button>
            </div>
          ) : (
            !quran.length && <p role="status">جارٍ تحميل قراءاتك…</p>
          )}
          {historyStarts.map((start) => (
            <section
              className="weekly-history-group"
              key={start}
              aria-label={weekLabel(start)}
            >
              <header>
                <span className="weekly-history-dot" />
                <div>
                  <h2>
                    {start === week.start ? "هذا الأسبوع" : "حصاد الأسبوع"}
                  </h2>
                  <time dateTime={start}>{weekLabel(start)}</time>
                </div>
              </header>
              <div className="community-posts">
                {history
                  .filter((p) => p.weekStart === start)
                  .map((post) => (
                    <ReadingCard key={post.id} post={post} history />
                  ))}
              </div>
            </section>
          ))}
          {!history.length && quran.length > 0 && (
            <div className="community-empty">
              <BookOpen size={30} />
              <p>قراءاتك، أسبوعًا بعد أسبوع.</p>
              <a href="#/today">ورد اليوم</a>
            </div>
          )}
        </div>
      ) : visiblePosts.length ? (
        <div className="community-posts">
          {visiblePosts.map((post) => (
            <ReadingCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="community-empty">
          <BookOpen size={30} />
          <p>
            {celebrating
              ? "كل قراءة لها مكان هنا، ولو بضع آيات."
              : "أكمل مهمة من وردك لتظهر هنا."}
          </p>
          <a href="#/today">ورد اليوم</a>
        </div>
      )}
    </section>
  );
}
