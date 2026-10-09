// Deliberately local prototype state. No production credit or publication API.
export const STORAGE_KEY = "safina.prototype.v1";
export const DEMO_DATE = "2026-09-28";
export const tiers = [
  {
    id: "B",
    label: "البقرة كل يوم",
    detail: "سورة البقرة · قراءة يومية",
    ready: true,
  },
  {
    id: "BI",
    label: "البقرة وآل عمران",
    detail: "سورتان · قراءة يومية",
    ready: true,
  },
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: `BJ${n}`,
    label: `البقرة + ${n === 1 ? "جزء" : n + " أجزاء"}`,
    detail:
      n < 4
        ? "مسار شهري · جدول ينتظر الاعتماد"
        : "مسار أسبوعي · بعض القواعد تنتظر الاعتماد",
    ready: false,
  })),
];
export const lessons = [
  "مساحة للقرآن في يومك",
  "خطوة صغيرة تدوم",
  "القراءة بانتباه",
  "فهم ما يعينك",
  "العودة بعد الانقطاع",
  "مراجعة مسارك",
  "التعلّم مع الآخرين",
  "من الفكرة إلى الممارسة",
  "مساحة للتأمّل",
  "رحلة تستمر",
];
export const media = [
  {
    id: "istighfar",
    title: "مساحة للاستغفار في يومك",
    topic: "الذكر",
    duration: "٠:١٢",
    tags: "istighfar استغفار الاستغفار ذكر",
    description:
      "بطاقة تجريبية لاختبار البحث والحفظ ومشغّل الفيديو. لا تتضمن درسًا دينيًا أو مادة منسوبة للمدرّب.",
    tone: "sage",
  },
  {
    id: "return",
    title: "العودة إلى وردك، خطوة بخطوة",
    topic: "الاستمرارية",
    duration: "٠:١٢",
    tags: "عودة انقطاع الاستمرارية قراءة",
    description:
      "محتوى توضيحي لتجربة المكتبة. ننتظر المادة المعتمدة ومصدرها قبل النشر.",
    tone: "sand",
  },
  {
    id: "reading",
    title: "تهيئة وقت هادئ للقراءة",
    topic: "القرآن",
    duration: "٠:١٢",
    tags: "القرآن وقت قراءة تدبر",
    description:
      "تجربة مرئية للمشغّل، وليست محاضرة حقيقية. النصوص والمراجع النهائية يزوّدها مالك المحتوى.",
    tone: "blue",
  },
  {
    id: "together",
    title: "صحبة تعينك على الاستمرار",
    topic: "الصحبة",
    duration: "٠:١٢",
    tags: "حلقة صحبة مجموعة",
    description:
      "مثال على تصنيف مواد المكتبة. لا يُنسب إلى مدرّب أو قناة خارجية.",
    tone: "rose",
  },
];
export function initialState() {
  return {
    version: 1,
    name: "رفيق الرحلة",
    countryCode: "",
    istighfarGoal: 100,
    istighfarDays: {},
    tier: "BI",
    entries: [],
    revisions: [],
    trace: null,
    reader: { surah: 2, from: 1, size: 30, mode: "reading" },
    quranBookmarks: [],
    journeySource: "prototype",
    dhikr: { label: "أستغفر الله", goal: 100, count: 0 },
    saved: [],
    notes: {},
    lessonDone: [],
    learningMode: "founder",
    courseLearning: {},
    courseAnswers: {},
    quiz: {},
    assignments: {},
    mediaProgress: {},
    groups: [
      {
        id: "demo-circle",
        name: "رفقة القرآن",
        description: "حلقة تجريبية هادئة للقراءة والمساندة",
        chat: true,
      },
    ],
    posts: [],
    messages: [],
    reactions: [],
    consent: {},
    reminder: false,
    reminderTime: "08:00",
    scenario: "normal",
    reducedMotion: false,
    largeText: false,
    welcomed: true,
  };
}
export function validateRange(surah, from, to, quran) {
  let s = quran.find((x) => x.id === Number(surah));
  return (
    !!s &&
    Number.isInteger(Number(from)) &&
    Number.isInteger(Number(to)) &&
    Number(from) >= 1 &&
    Number(to) >= Number(from) &&
    Number(to) <= s.total_verses
  );
}
export function uniqueCount(entries, surah, date = DEMO_DATE) {
  const values = new Set();
  entries
    .filter((e) => !e.retracted && e.date === date && e.surah === surah)
    .forEach((e) => {
      for (let i = e.from; i <= e.to; i++) values.add(i);
    });
  return values.size;
}
export function componentStatus(entries, surah, total, date = DEMO_DATE) {
  const count = uniqueCount(entries, surah, date);
  return {
    count,
    status: count >= total ? "complete" : count > 0 ? "partial" : "no_entry",
  };
}
export function demoEvaluation(state, date = DEMO_DATE) {
  if (state.scenario === "free") return { status: "free", credit: null };
  const required =
    state.tier === "B"
      ? [[2, 286]]
      : [
          [2, 286],
          [3, 200],
        ];
  if (!["B", "BI"].includes(state.tier) || state.scenario === "policy")
    return { status: "awaiting_policy", credit: null };
  const done = required.every(
    ([s, n]) => uniqueCount(state.entries, s, date) >= n,
  );
  return {
    status: done
      ? "complete"
      : state.entries.some(
            (e) =>
              !e.retracted &&
              e.date === date &&
              required.some(([surah]) => surah === e.surah),
          )
        ? "partial"
        : "no_entry",
    credit: done ? 1 : null,
  };
}
export function upsertEntry(state, entry) {
  const previous = entry.id
    ? state.entries.find((e) => e.id === entry.id)
    : null;
  const next = {
    ...entry,
    id: entry.id || crypto.randomUUID(),
    revision: (previous?.revision || 0) + 1,
    retracted: false,
    at: new Date().toISOString(),
  };
  return {
    ...state,
    entries: previous
      ? state.entries.map((e) => (e.id === next.id ? next : e))
      : [...state.entries, next],
    revisions: previous ? [...state.revisions, previous] : state.revisions,
    posts: state.posts.filter((p) => p.entryId !== next.id),
  };
}
export function retractEntry(state, id) {
  return {
    ...state,
    entries: state.entries.map((e) =>
      e.id === id ? { ...e, retracted: true, revision: e.revision + 1 } : e,
    ),
    revisions: [
      ...state.revisions,
      ...state.entries.filter((e) => e.id === id),
    ],
    posts: state.posts.filter((p) => p.entryId !== id),
  };
}
export function searchMedia(query, topic = "الكل") {
  const q = query
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه");
  return media.filter(
    (m) =>
      (topic === "الكل" || m.topic === topic) &&
      (!q ||
        `${m.title} ${m.tags}`
          .toLowerCase()
          .replace(/[أإآ]/g, "ا")
          .replace(/ة/g, "ه")
          .includes(q)),
  );
}
// Undo only the touched record; later notes, counts, and unrelated records survive.
// A reverted private record is not automatically republished.
export function undoReadingMutation(current, before, id) {
  const previous = before.entries.find((e) => e.id === id);
  return {
    ...current,
    entries: [
      ...current.entries.filter((e) => e.id !== id),
      ...(previous ? [previous] : []),
    ],
    revisions: [
      ...current.revisions.filter((e) => e.id !== id),
      ...before.revisions.filter((e) => e.id === id),
    ],
    posts: current.posts.filter((p) => p.entryId !== id),
  };
}
