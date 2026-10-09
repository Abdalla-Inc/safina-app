// Presentation belongs to the frontend; IDs match the engine's level.* tokens.
export const communityLevels = {
  B: {
    accent: "#506c3f",
    tint: "#f3f6ed",
    line: "#dce6cc",
    label: "البقرة كل يوم",
  },
  BI: {
    accent: "#216d68",
    tint: "#eef7f4",
    line: "#cfe7df",
    label: "البقرة وآل عمران",
  },
  BJ1: {
    accent: "#356a94",
    tint: "#eff5fa",
    line: "#d3e3f1",
    label: "البقرة + جزء",
  },
  BJ2: {
    accent: "#986525",
    tint: "#fbf5e9",
    line: "#eddfbf",
    label: "البقرة + جزآن",
  },
  BJ3: {
    accent: "#a05266",
    tint: "#fcf0f3",
    line: "#efd6dd",
    label: "البقرة + ثلاثة أجزاء",
  },
  BJ4: {
    accent: "#5863a3",
    tint: "#f1f2fc",
    line: "#dcdff3",
    label: "البقرة + أربعة أجزاء",
  },
  BJ5: {
    accent: "#764a96",
    tint: "#f7f0fc",
    line: "#e5d6f0",
    label: "البقرة + خمسة أجزاء",
  },
};
const neutral = {
  accent: "#657066",
  tint: "#f5f6f3",
  line: "#dfe4dc",
  label: "ورد القراءة",
};
export function checkinTier(post) {
  if (post.tierAtCompletion) return post.tierAtCompletion;
  // Legacy local cards only ever used these two verified preview assignments.
  const ids = post.assignment
    ?.map((task) => task.surah)
    .sort((a, b) => a - b)
    .join(",");
  return ids === "2,3" ? "BI" : ids === "2" ? "B" : null;
}
export function checkinPalette(post) {
  return communityLevels[checkinTier(post)] || neutral;
}
