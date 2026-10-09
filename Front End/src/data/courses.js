import { publicAsset } from "../publicAsset.js";
const titles = [
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
export const courses = [
  {
    id: "safina-vip",
    title: "سفينة النور — البرنامج الخاص",
    shortTitle: "سفينة النور",
    badge: "VIP",
    format: "برنامج أسبوعي",
    thumbnail: publicAsset("/courses/safina.svg"),
    description: "المنهج الكامل، أسبوعًا بعد أسبوع.",
    modules: titles.map((title, i) => ({
      id: `week-${i + 1}`,
      title: `الأسبوع ${(i + 1).toLocaleString("ar-EG")}`,
      subtitle: title,
      lessons: [
        {
          id: `lesson-${i + 1}`,
          title,
          thumbnail: publicAsset(`/courses/lesson-${i + 1}.svg`),
        },
        ...(i === 0
          ? [
              {
                id: "welcome",
                title: "كيف تستخدم مساحة التعلّم",
                thumbnail: publicAsset("/courses/welcome.svg"),
              },
            ]
          : []),
      ],
      questions: [
        {
          id: "reflection",
          label: "ما الفكرة التي تريد تطبيقها؟",
          type: "text",
        },
        {
          id: "plan",
          label: "متى ستعود إلى ما تعلّمته؟",
          type: "choice",
          options: ["اليوم", "خلال هذا الأسبوع", "سأحدّد وقتًا لاحقًا"],
        },
      ],
    })),
  },
  {
    id: "health",
    title: "دورة الصحة",
    shortTitle: "دورة الصحة",
    badge: "CLASS",
    format: "محاضرة واحدة",
    thumbnail: publicAsset("/courses/health.svg"),
    description: "محاضرة متكاملة في مكان واحد.",
    modules: [
      {
        id: "class",
        title: "المحاضرة",
        subtitle: "دورة الصحة",
        lessons: [
          {
            id: "full-class",
            title: "دورة الصحة — المحاضرة الكاملة",
            thumbnail: publicAsset("/courses/health-lesson.svg"),
          },
        ],
        questions: [
          {
            id: "reflection",
            label: "ما الذي تودّ الاحتفاظ به من المحاضرة؟",
            type: "text",
          },
          {
            id: "plan",
            label: "هل ترغب في مراجعة ملاحظاتك؟",
            type: "choice",
            options: ["نعم", "لاحقًا"],
          },
        ],
      },
    ],
  },
];
export const courseById = (id) => courses.find((c) => c.id === id);
export const lessonKey = (courseId, lessonId) => `${courseId}:${lessonId}`;
export const moduleKey = (courseId, moduleId) => `${courseId}:${moduleId}`;
export const lessonComplete = (state, courseId, lessonId) =>
  Boolean(state.courseLearning?.[lessonKey(courseId, lessonId)]?.completed);
export function answersComplete(module, answers = {}) {
  return module.questions.every((q) =>
    q.type === "choice"
      ? q.options.includes(answers[q.id])
      : typeof answers[q.id] === "string" && answers[q.id].trim().length > 0,
  );
}
export function moduleComplete(state, course, module) {
  const submission = state.courseAnswers?.[moduleKey(course.id, module.id)];
  return (
    module.lessons.every((l) => lessonComplete(state, course.id, l.id)) &&
    Boolean(submission?.submitted) &&
    answersComplete(module, submission.answers)
  );
}
export function canAccessModule(state, course, index) {
  if (!course || index < 0 || index >= course.modules.length) return false;
  return (
    state.learningMode !== "learner" ||
    course.modules
      .slice(0, index)
      .every((m) => moduleComplete(state, course, m))
  );
}
export const courseProgress = (state, course) =>
  Math.round(
    (course.modules.filter((m) => moduleComplete(state, course, m)).length /
      course.modules.length) *
      100,
  );
export function resumeLesson(state, course) {
  for (const [i, m] of course.modules.entries()) {
    if (!canAccessModule(state, course, i)) continue;
    if (!moduleComplete(state, course, m))
      return (
        m.lessons.find((l) => !lessonComplete(state, course.id, l.id)) ||
        m.lessons.at(-1)
      );
  }
  return course.modules[0].lessons[0];
}
export const lessonRoute = (course, lesson) =>
  `lesson/${course.id}/${lesson.id}`;
