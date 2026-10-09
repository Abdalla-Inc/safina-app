import { COMMUNITY_MEMBER, exampleCheckins } from "./community.js";

const number = (n) => new Intl.NumberFormat("ar-EG").format(n);
const completeReadings = (n) =>
  n === 1
    ? "قراءة كاملة"
    : n === 2
      ? "قراءتان كاملتان"
      : `${number(n)} ${n <= 10 ? "قراءات كاملة" : "قراءة كاملة"}`;
export function shiftDay(day, count) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function readingWeek(day) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  const start = shiftDay(day, -weekday);
  return { start, end: shiftDay(start, 6), saturday: weekday === 6 };
}
export function weekLabel(start) {
  const format = (day) =>
    new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Riyadh",
    }).format(new Date(`${day}T12:00:00+03:00`));
  return `${format(start)} — ${format(shiftDay(start, 6))}`;
}
export function weeklyVerse(start) {
  const verses = [
    [53, 39],
    [76, 22],
    [99, 7],
    [18, 30],
  ];
  return verses[
    Math.floor(Date.parse(`${start}T12:00:00Z`) / 604800000) % verses.length
  ];
}

// A factual local history projection, not ship credit, juz estimation or khatma proof.
// Only commitment reading belongs here. Unknown legacy levels stay neutral.
export function ownReadingWeeks(state, quran, throughDay) {
  const chapters = new Map(quran.map((s) => [s.id, s]));
  const groups = new Map();
  for (const entry of state.entries || []) {
    if (
      entry.retracted ||
      entry.date > throughDay ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date || "")
    )
      continue;
    const date = new Date(`${entry.date}T12:00:00Z`);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== entry.date
    )
      continue;
    const chapter = chapters.get(entry.surah);
    if (
      !chapter ||
      !Number.isInteger(entry.from) ||
      !Number.isInteger(entry.to) ||
      entry.from < 1 ||
      entry.to < entry.from ||
      entry.to > chapter.total_verses
    )
      continue;
    const tier = entry.tier || null;
    const assigned =
      tier === "B" || tier?.startsWith("BJ")
        ? entry.surah === 2
        : [2, 3].includes(entry.surah);
    if (!assigned && !entry.custom) continue;
    const { start, end } = readingWeek(entry.date);
    if (!groups.has(start)) groups.set(start, { start, end, days: new Map() });
    const week = groups.get(start);
    if (!week.days.has(entry.date)) week.days.set(entry.date, new Map());
    const day = week.days.get(entry.date);
    if (!day.has(entry.surah))
      day.set(entry.surah, { chapter, covered: new Set(), levels: new Set() });
    const record = day.get(entry.surah);
    if (tier) record.levels.add(tier);
    for (let v = entry.from; v <= entry.to; v++) record.covered.add(v);
  }
  for (const [date, activity] of Object.entries(state.istighfarDays || {})) {
    if (date > throughDay || activity.count <= 0) continue;
    const { start, end } = readingWeek(date);
    if (!groups.has(start)) groups.set(start, { start, end, days: new Map() });
    const week = groups.get(start);
    if (!week.days.has(date)) week.days.set(date, new Map());
    week.istighfar = { ...week.istighfar, [date]: activity };
  }
  return [...groups.values()]
    .sort((a, b) => b.start.localeCompare(a.start))
    .map((week) => {
      const totals = new Map();
      const days = [...week.days.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, readings]) => {
          const items = [...readings.values()].map((record) => {
            const { chapter, covered, levels } = record;
            const complete = covered.size === chapter.total_verses;
            const tierList = [...levels];
            if (!totals.has(chapter.id))
              totals.set(chapter.id, {
                chapter,
                complete: 0,
                partial: 0,
                union: new Set(),
              });
            const total = totals.get(chapter.id);
            if (complete) total.complete++;
            else total.partial += covered.size;
            covered.forEach((v) => total.union.add(v));
            return {
              name: `سورة ${chapter.name}`,
              count: covered.size,
              total: chapter.total_verses,
              complete,
              levels: tierList,
              tierAtCompletion: tierList.at(-1) || null,
            };
          });
          const activity = week.istighfar?.[date];
          if (activity)
            items.push({
              kind: "istighfar",
              name: "الاستغفار",
              count: activity.count,
              total: activity.target,
              complete: activity.count >= activity.target,
              levels: [activity.tier].filter(Boolean),
              tierAtCompletion: activity.tier,
            });
          return { date, items };
        });
      const levels = [
        ...new Set(days.flatMap((d) => d.items.flatMap((i) => i.levels))),
      ];
      const tasks = [...totals.values()].map((total) => {
        let full = total.complete;
        let partial = total.partial;
        // A surah spread across several days can have one proven whole coverage.
        if (!full && total.union.size === total.chapter.total_verses) {
          full = 1;
          partial = 0;
        }
        return {
          name: `سورة ${total.chapter.name}`,
          detail: full
            ? `${completeReadings(full)}${partial ? ` · و${number(partial)} آية في قراءات جزئية` : ""}`
            : `${number(partial)} آية في قراءات جزئية`,
        };
      });
      const istighfarTotal = Object.values(week.istighfar || {}).reduce(
        (n, d) => n + d.count,
        0,
      );
      if (istighfarTotal)
        tasks.push({
          kind: "istighfar",
          name: "الاستغفار",
          detail: `${number(istighfarTotal)} مرة`,
        });
      return {
        id: `week:${COMMUNITY_MEMBER}:${week.start}`,
        memberId: COMMUNITY_MEMBER,
        name: state.name || "رفيق الرحلة",
        countryCode: state.countryCode || "",
        weekStart: week.start,
        weekEnd: week.end,
        day: week.end,
        tierAtCompletion: levels[0] || null,
        levels,
        tasks,
        days,
        readingDays: days.filter((d) =>
          d.items.some((i) => i.kind !== "istighfar"),
        ).length,
        activityDays: days.length,
        weekly: true,
        updatedAt: `${days[0].date}T12:00:00+03:00`,
        heartCount: 0,
      };
    });
}

export function exampleCelebration(start) {
  const end = shiftDay(start, 6);
  const summaries = [
    [
      { name: "ختمة كاملة للقرآن", detail: "مثال توضيحي" },
      { name: "سورة البقرة", detail: "٦ قراءات كاملة" },
    ],
    [
      { name: "سورة البقرة", detail: "٦ قراءات كاملة" },
      { name: "سورة آل عمران", detail: "٤ قراءات كاملة" },
    ],
    [
      { name: "سورة البقرة", detail: "٥ قراءات كاملة" },
      { name: "١٥ جزءًا", detail: "قراءة خلال الأسبوع" },
    ],
    [{ name: "سورة البقرة", detail: "٣ قراءات كاملة" }],
    [
      { name: "سورة البقرة", detail: "٦ قراءات كاملة" },
      { name: "٧ أجزاء", detail: "قراءة خلال الأسبوع" },
    ],
    [
      { name: "سورة البقرة", detail: "٤ قراءات كاملة" },
      { name: "١٢ جزءًا", detail: "قراءة خلال الأسبوع" },
    ],
    [{ name: "سورة البقرة", detail: "٤٠ آية · قراءة جزئية" }],
  ];
  return exampleCheckins(end).map((post, i) => ({
    ...post,
    id: `week:${post.memberId}:${start}`,
    weekly: true,
    weekStart: start,
    weekEnd: end,
    tasks: [
      ...summaries[i % summaries.length],
      {
        kind: "istighfar",
        name: `استغفار ${number([600, 3000, 5000, 450, 1200, 9000, 60000][i % 7])} مرة`,
      },
    ],
    readingDays: [6, 6, 5, 3, 6, 4, 1][i % 7],
    heartCount: [64, 38, 26, 21, 35, 29, 18][i % 7],
  }));
}
export function exampleOwnWeeks(day) {
  const current = readingWeek(day).start;
  return [0, 1, 2, 3].map((offset) => {
    const start = shiftDay(current, -7 * offset);
    const tier = offset === 3 ? "B" : "BI";
    const days = Array.from(
      {
        length: offset
          ? 6
          : Math.min(6, new Date(`${day}T12:00:00Z`).getUTCDay() + 1),
      },
      (_, i) => ({
        date: shiftDay(start, i),
        items: [
          {
            name: "سورة البقرة",
            count: 286,
            total: 286,
            complete: true,
            tierAtCompletion: tier,
          },
          ...(tier === "BI"
            ? [
                {
                  name: "سورة آل عمران",
                  count: i === 2 ? 35 : 200,
                  total: 200,
                  complete: i !== 2,
                  tierAtCompletion: tier,
                },
              ]
            : []),
        ],
      }),
    ).reverse();
    return {
      id: `week:example-own:${start}`,
      memberId: "example-own",
      name: "سجلّ توضيحي",
      countryCode: "SA",
      previousTier: offset === 2 ? "B" : null,
      example: true,
      weekly: true,
      tierAtCompletion: tier,
      levels: [tier],
      weekStart: start,
      weekEnd: shiftDay(start, 6),
      readingDays: days.length,
      days,
      tasks: [
        { name: "سورة البقرة", detail: completeReadings(days.length) },
        ...(tier === "BI"
          ? [
              {
                name: "سورة آل عمران",
                detail: `${completeReadings(days.filter((d) => d.items[1].complete).length)}${days.some((d) => !d.items[1].complete) ? " · و٣٥ آية" : ""}`,
              },
            ]
          : []),
      ],
      heartCount: [8, 24, 19, 12][offset],
    };
  });
}
