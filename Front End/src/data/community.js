import { customReadings, istighfarForDay } from "./dailyActivity.js";
import { wirdRows } from "./wird.js";
import { checkinTier } from "./communityLevels.js";
export const COMMUNITY_ZONE = "Asia/Riyadh";
export const COMMUNITY_MEMBER = "local-founder";
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: COMMUNITY_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function meccaDay(instant = new Date()) {
  return dayFormatter.format(new Date(instant));
}
export function nextMeccaMidnight(instant = new Date()) {
  return new Date(`${meccaDay(instant)}T21:00:00.000Z`).getTime();
}

function completedTasks(entries, assignment, day) {
  return assignment.filter((task) => {
    const covered = new Set();
    entries
      .filter((e) => !e.retracted && e.date === day && e.surah === task.surah)
      .forEach((e) => {
        for (let v = Math.max(1, e.from); v <= Math.min(task.total, e.to); v++)
          covered.add(v);
      });
    return covered.size === task.total;
  });
}

// A local projection only. The backend must publish and count its own verified
// assignment completion events; browser preferences are not production proof.
export function reconcileCheckins(before, next, instant = new Date()) {
  if (
    before.entries === next.entries &&
    before.tier === next.tier &&
    before.name === next.name &&
    before.countryCode === next.countryCode &&
    before.istighfarDays === next.istighfarDays
  )
    return next;
  const today = meccaDay(instant),
    stamp = new Date(instant).toISOString();
  const existing = next.communityCheckins || [];
  const days = new Set([...existing.map((p) => p.day), today]);
  const posts = existing.filter((p) => p.memberId !== COMMUNITY_MEMBER);
  for (const day of days) {
    const old = existing.find(
      (p) => p.day === day && p.memberId === COMMUNITY_MEMBER,
    );
    // Historical corrections can remove/update an existing check-in, but must
    // never backfill old private history into a newly automatic feed.
    if (!old && day !== today) continue;
    const available = day === today ? wirdRows(next) : [];
    const assignment = available.length ? available : old?.assignment || [];
    const assignedTasks = completedTasks(next.entries, assignment, day);
    const custom = customReadings(next, day).filter((task) => {
      const acts = next.entries.filter(
        (e) => !e.retracted && e.customGroupId === task.id && e.date === day,
      );
      return !acts.every((e) => assignedTasks.some((a) => a.surah === e.surah));
    });
    const istighfar = istighfarForDay(next, day);
    const tasks = [
      ...assignedTasks,
      ...custom,
      ...(istighfar.count > 0
        ? [
            {
              kind: "istighfar",
              name: `استغفار ${new Intl.NumberFormat("ar-EG").format(istighfar.count)} مرة`,
            },
          ]
        : []),
    ];
    if (!tasks.length) continue;
    if (
      !old &&
      before.entries === next.entries &&
      before.istighfarDays === next.istighfarDays
    )
      continue;
    if (!old) {
      const previousTasks = completedTasks(before.entries, assignment, day);
      const newAssignment = assignedTasks.some(
        (task) => !previousTasks.some((p) => p.surah === task.surah),
      );
      const newCustom =
        JSON.stringify(custom) !== JSON.stringify(customReadings(before, day));
      const newIstighfar =
        istighfar.count !== istighfarForDay(before, day).count;
      if (!newAssignment && !newCustom && !newIstighfar) continue;
    }
    const fingerprint = JSON.stringify({ tasks, assignment });
    posts.push({
      id: old?.id || `${COMMUNITY_MEMBER}:${day}`,
      memberId: COMMUNITY_MEMBER,
      name: next.name || "رفيق الرحلة",
      countryCode: next.countryCode || "",
      day,
      tierAtCompletion: old ? checkinTier(old) : next.tier,
      assignment,
      tasks,
      complete:
        assignment.length > 0 && assignedTasks.length === assignment.length,
      istighfarComplete: istighfar.count >= istighfar.target,
      fingerprint,
      createdAt: old?.createdAt || stamp,
      updatedAt: old?.fingerprint === fingerprint ? old.updatedAt : stamp,
    });
  }
  return { ...next, communityCheckins: posts };
}

export function dailyCheckins(posts, day) {
  const unique = new Map();
  for (const post of posts.filter((p) => p.day === day)) {
    const old = unique.get(post.memberId);
    if (!old || post.updatedAt > old.updatedAt) unique.set(post.memberId, post);
  }
  return [...unique.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
export function completedPeople(posts, day) {
  return dailyCheckins(posts, day).filter((p) => p.complete).length;
}
export const communityVerses = [
  [83, 26],
  [3, 133],
  [57, 21],
  [27, 92],
  [29, 45],
];
export function verseForDay(day) {
  return communityVerses[
    Math.floor(Date.parse(`${day}T12:00:00Z`) / 86400000) %
      communityVerses.length
  ];
}

export function exampleCheckins(day, instant = new Date()) {
  const start = Date.parse(`${day}T00:00:00+03:00`);
  const elapsed = Math.min(
    86399999,
    Math.max(0, new Date(instant).getTime() - start),
  );
  const baqarah = { surah: 2, name: "سورة البقرة", total: 286 };
  const imran = { surah: 3, name: "سورة آل عمران", total: 200 };
  // Illustrative reading summaries, never used to define or award assignments.
  return [
    { name: "مريم أحمد", tier: "BJ5", extra: "خمسة أجزاء", hearts: 42 },
    { name: "عمر خالد", tier: "BI", tasks: [baqarah, imran], hearts: 28 },
    { name: "سارة علي", tier: "BJ3", extra: "ثلاثة أجزاء", hearts: 19 },
    { name: "يوسف حسن", tier: "B", tasks: [baqarah], hearts: 36 },
    { name: "نور عبدالله", tier: "BJ1", extra: "جزء واحد", hearts: 24 },
    { name: "أحمد محمد", tier: "BJ4", extra: "أربعة أجزاء", hearts: 17 },
    { name: "هدى إبراهيم", tier: "BJ2", extra: "جزآن", hearts: 12 },
    { name: "ليلى محمود", tier: "B", tasks: [baqarah], hearts: 21 },
    { name: "عبدالله سالم", tier: "BI", tasks: [baqarah, imran], hearts: 18 },
    { name: "فاطمة ياسين", tier: "BJ1", extra: "جزء واحد", hearts: 32 },
    { name: "خالد أمين", tier: "BJ2", extra: "جزآن", hearts: 15 },
    { name: "آمنة عثمان", tier: "BJ3", extra: "ثلاثة أجزاء", hearts: 26 },
    { name: "حسن مصطفى", tier: "BJ4", extra: "أربعة أجزاء", hearts: 23 },
    { name: "ريم صالح", tier: "BJ5", extra: "خمسة أجزاء", hearts: 31 },
  ].map((p, i) => ({
    id: `example-${p.tier}${i < 7 ? "" : `-${i}`}:${day}`,
    memberId: `example-${p.tier}${i < 7 ? "" : `-${i}`}`,
    name: p.name,
    countryCode: [
      "SA",
      "SD",
      "EG",
      "MA",
      "AU",
      "JO",
      "AE",
      "QA",
      "KW",
      "OM",
      "GB",
      "US",
      "TR",
      "CA",
    ][i],
    reactionCounts: {
      "❤️": p.hearts,
      "👏": Math.max(1, Math.floor(p.hearts / 3)),
      "🤲": Math.max(1, Math.floor(p.hearts / 5)),
    },
    tierAtCompletion: p.tier,
    tasks: [
      ...(p.tasks || [baqarah, { name: p.extra }]),
      {
        kind: "istighfar",
        name: `استغفار ${new Intl.NumberFormat("ar-EG").format([100, 500, 1000, 75, 200, 1500, 10000][i % 7])} مرة`,
      },
    ],
    avatar: `/community/portrait-${(i % 7) + 1}.svg`,
    heartCount: p.hearts,
    complete: true,
    day,
    example: true,
    updatedAt: new Date(
      start + Math.max(0, elapsed - (i + 1) * 480000),
    ).toISOString(),
  }));
}
