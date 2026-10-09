import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useApp } from "../context.jsx";
import "./ProfilePhoto.css";

export function ProfileAvatar({ src, name = "" }) {
  const [failed, setFailed] = useState(null);
  return (
    <span className="profile-avatar" aria-hidden="true">
      {src && failed !== src ? (
        <img src={src} alt="" onError={() => setFailed(src)} />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}

export function ProfilePhoto() {
  const { state, update } = useApp();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setMessage("اختر صورة JPG أو PNG أو WebP بحجم أقل من ١٠ ميغابايت.");
      return;
    }
    setBusy(true);
    setMessage("");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 256 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f5f4eb";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      update({ profilePhoto: canvas.toDataURL("image/jpeg", 0.86) });
      setMessage("تم تحديث صورتك في المعاينة المحلية.");
    } catch {
      setMessage("تعذّر فتح الصورة. جرّب صورة أخرى.");
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  }
  return (
    <div className="profile-photo-editor">
      <div className="profile-photo-actions">
        <ProfileAvatar src={state.profilePhoto} name={state.name} />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Camera size={17} />
          {busy
            ? "جارٍ تجهيز الصورة…"
            : state.profilePhoto
              ? "تغيير الصورة"
              : "إضافة صورة"}
        </button>
        {state.profilePhoto && (
          <button
            className="profile-photo-remove"
            type="button"
            disabled={busy}
            onClick={() => {
              update({ profilePhoto: null });
              setMessage("تمت إزالة الصورة.");
            }}
          >
            إزالة
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="الصورة الشخصية"
        onChange={selectPhoto}
        hidden
      />
      <p role="status">{message || "اختيارية · تظهر بجانب مشاركاتك"}</p>
    </div>
  );
}
