import { publicAsset } from "../publicAsset.js";
import { useEffect, useRef } from "react";
import { X, ArrowLeft, Check, Bookmark, Play } from "lucide-react";
import { useApp } from "../context.jsx";
export function Button({ children, variant = "", className = "", ...props }) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      className={`icon-btn ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
export function Heading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  closeDisabled = false,
}) {
  const ref = useRef(null);
  useEffect(() => {
    let previous = document.activeElement;
    ref.current.showModal();
    return () => {
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        if (closeDisabled) e.preventDefault();
        else onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !closeDisabled) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <IconButton label="إغلاق" onClick={onClose} disabled={closeDisabled}>
          <X />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={32} />}
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Pill({ children, tone = "" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
export function SectionTitle({ title, link, onClick }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {link && (
        <button className="text-btn" onClick={onClick}>
          {link}
          <ArrowLeft size={16} />
        </button>
      )}
    </div>
  );
}
export function SaveButton({ saved, onClick }) {
  return (
    <IconButton
      label={saved ? "إزالة من المحفوظات" : "حفظ"}
      aria-pressed={saved}
      onClick={onClick}
    >
      <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
    </IconButton>
  );
}
export function MediaArtwork({ tone = "sage", className = "" }) {
  return (
    <div className={`media-art ${tone} ${className}`} aria-hidden="true">
      <div className="art-arch">
        <div />
        <div />
        <div />
      </div>
      <div className="art-sun" />
      <span className="play-bubble">
        <Play size={20} fill="currentColor" />
      </span>
      <small>مقطع توضيحي</small>
    </div>
  );
}
export function DemoVideo({
  mediaKey = "preview",
  poster = "/media-poster.svg",
  onEnded,
}) {
  const { state, update } = useApp();
  const lastSaved = useRef(-1);
  const resumeAt = useRef(state.mediaProgress?.[mediaKey] || 0);
  function savePosition(event) {
    const seconds = Math.floor(event.currentTarget.currentTime);
    if (seconds === lastSaved.current) return;
    lastSaved.current = seconds;
    update((s) => ({
      ...s,
      mediaProgress: { ...s.mediaProgress, [mediaKey]: seconds },
    }));
  }
  return (
    <div className="demo-video">
      <video
        controls
        preload="metadata"
        playsInline
        aria-label="مقطع مرئي تجريبي بلا صوت"
        poster={publicAsset(poster)}
        onEnded={onEnded}
        onLoadedMetadata={(event) => {
          if (
            resumeAt.current > 0 &&
            resumeAt.current < event.currentTarget.duration - 1
          )
            event.currentTarget.currentTime = resumeAt.current;
        }}
        onTimeUpdate={savePosition}
      >
        <source src={publicAsset("/demo.webm")} type="video/webm" />
        <track
          kind="captions"
          src={publicAsset("/demo.vtt")}
          srcLang="ar"
          label="العربية"
          default
        />
        متصفحك لا يدعم الفيديو.
      </video>
      <label className="speed-control">
        سرعة التشغيل{" "}
        <select
          defaultValue="1"
          onChange={(e) => {
            e.currentTarget
              .closest(".demo-video")
              .querySelector("video").playbackRate = Number(e.target.value);
          }}
        >
          <option value=".75">0.75×</option>
          <option value="1">1×</option>
          <option value="1.25">1.25×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2×</option>
        </select>
      </label>
      <p className="caption">
        مقطع مرئي توضيحي بلا صوت · ١٢ ثانية · ليس درسًا من البرنامج.
      </p>
    </div>
  );
}
