export const reactionOptions = [
  { emoji: "❤️", label: "محبة" },
  { emoji: "👏", label: "تشجيع" },
  { emoji: "🤲", label: "دعاء" },
  { emoji: "👍", label: "إعجاب" },
  { emoji: "🔥", label: "حماس" },
];
export function selectedReaction(state, id) {
  return Object.hasOwn(state.communityReactions || {}, id)
    ? state.communityReactions[id]
    : (state.communityHearts || []).includes(id)
      ? "❤️"
      : null;
}
export function toggleReaction(state, id, emoji) {
  if (!reactionOptions.some((r) => r.emoji === emoji)) return state;
  return {
    ...state,
    communityReactions: {
      ...state.communityReactions,
      [id]: selectedReaction(state, id) === emoji ? null : emoji,
    },
    communityHearts: (state.communityHearts || []).filter((x) => x !== id),
  };
}
