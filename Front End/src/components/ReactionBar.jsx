import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { useApp, ar } from "../context.jsx";
import {
  reactionOptions,
  selectedReaction,
  toggleReaction,
} from "../data/reactions.js";
export function ReactionBar({ post }) {
  const { state, update } = useApp();
  const [open, setOpen] = useState(false),
    [announcement, setAnnouncement] = useState("");
  const selected = selectedReaction(state, post.id);
  const counts = post.reactionCounts || { "❤️": post.heartCount || 0 };
  const react = (r) => {
    update((s) => toggleReaction(s, post.id, r.emoji));
    setAnnouncement(
      selected === r.emoji ? "أُزيل التفاعل" : `أُضيف تفاعل ${r.label}`,
    );
    setOpen(false);
  };
  return (
    <div
      className="reaction-bar"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="reaction-pills">
        {reactionOptions
          .filter(
            (r) =>
              (counts[r.emoji] || 0) > 0 ||
              r.emoji === selected ||
              r.emoji === "❤️",
          )
          .map((r) => (
            <button
              key={r.emoji}
              className="emoji-reaction"
              aria-label={`${r.label} · ${post.name}`}
              aria-pressed={selected === r.emoji}
              onClick={() => react(r)}
            >
              <span aria-hidden="true">{r.emoji}</span>
              <span>
                {ar((counts[r.emoji] || 0) + (selected === r.emoji ? 1 : 0))}
              </span>
            </button>
          ))}
        <button
          className="reaction-add"
          aria-label={`إضافة تفاعل · ${post.name}`}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <SmilePlus size={18} />
        </button>
      </div>
      {open && (
        <div className="reaction-picker" role="group" aria-label="اختر تفاعلاً">
          {reactionOptions.map((r) => (
            <button
              key={r.emoji}
              aria-label={r.label}
              aria-pressed={selected === r.emoji}
              onClick={() => react(r)}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
      <span className="wird-sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}
