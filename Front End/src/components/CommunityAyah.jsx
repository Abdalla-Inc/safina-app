import { useApp, ar } from "../context.jsx";
import { verseForDay } from "../data/community.js";
import { weeklyVerse } from "../data/communityWeeks.js";

export function CommunityAyah({ day, weekStart, weekly = false }) {
  const { quran, quranError, retryQuran } = useApp();
  const [sid, vid] = weekly ? weeklyVerse(weekStart) : verseForDay(day);
  const chapter = quran.find((s) => s.id === sid);
  const verse = chapter?.verses.find((v) => v.id === vid);
  return (
    <aside
      className="community-ayah"
      aria-label={weekly ? "آية الأسبوع" : "آية اليوم"}
    >
      {verse ? (
        <>
          <p dir="rtl">{verse.text}</p>
          <a href={`#/reader/${sid}/${vid}`}>
            {chapter.name} · {ar(vid)}
          </a>
        </>
      ) : quranError ? (
        <button onClick={retryQuran}>إعادة تحميل الآية</button>
      ) : (
        <span role="status">جارٍ تحميل الآية…</span>
      )}
    </aside>
  );
}
