import { useEffect, useState } from "react";
import { useAccount } from "./context.js";
import { request, mutation } from "../services/connected.js";
import { ar, navigate } from "../context.jsx";
import { Button } from "../components/UI.jsx";
import "../components/CustomCommitmentFields.css";

export const canPreviewShip = (me) => me?.permissions?.shipPreview === true;
export function AdminShipPreview({ onPreview }) {
  const { me } = useAccount();
  const [saved, setSaved] = useState(null),
    [draft, setDraft] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    request("/admin/ship-preview")
      .then((value) => {
        if (active) {
          setSaved(value);
          setDraft(value);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [me.id, version]);
  useEffect(() => {
    onPreview(
      draft?.enabled
        ? {
            buildStep: draft.buildStep,
            health: draft.health,
            phase: draft.buildStep < 30 ? "construction" : "maintenance",
          }
        : null,
    );
    return () => onPreview(null);
  }, [draft?.enabled, draft?.buildStep, draft?.health, onPreview]);
  const change = (patch) => setDraft((d) => ({ ...d, ...patch }));
  async function save(reset = false) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request("/admin/ship-preview", {
        method: reset ? "DELETE" : "PUT",
        body: mutation({
          expectedRevision: saved.revision,
          ...(!reset
            ? {
                buildStep: draft.buildStep,
                health: draft.health,
                celebration: draft.celebration,
              }
            : {}),
        }),
      });
      setSaved(result);
      setDraft(result);
      setMessage(
        reset ? "تُعرض سفينتك الفعلية الآن." : "حُفظت إعدادات المعاينة.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="admin-preview-panel" open>
      <summary>أدوات المالك · عرض تجريبي</summary>
      {draft && (
        <div className="admin-preview-controls">
          <label>
            <input
              type="checkbox"
              checked={!!draft.enabled}
              onChange={(e) => change({ enabled: e.target.checked })}
              disabled={busy}
            />
            معاينة السفينة
          </label>
          <label>
            البناء{" "}
            <output>
              {ar(draft.buildStep)} / {ar(30)}
            </output>
            <input
              aria-label="مراحل بناء السفينة"
              type="range"
              min="0"
              max="30"
              step="1"
              value={draft.buildStep}
              disabled={busy}
              onChange={(e) =>
                change({ enabled: true, buildStep: Number(e.target.value) })
              }
            />
          </label>
          <label>
            حالة السفينة <output>{ar(draft.health)}٪</output>
            <input
              aria-label="صحة السفينة"
              type="range"
              min="0"
              max="100"
              step="1"
              value={draft.health}
              disabled={busy}
              onChange={(e) =>
                change({ enabled: true, health: Number(e.target.value) })
              }
            />
          </label>
          <p className="quiet-note">
            هذه المعاينة لا تغيّر قراءاتك أو تقدّمك الفعلي.
          </p>
          <div className="connected-actions">
            <Button disabled={busy || !draft.enabled} onClick={() => save()}>
              حفظ المعاينة
            </Button>
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => save(true)}
            >
              العودة إلى سفينتي
            </Button>
          </div>
          <button
            className="text-btn"
            onClick={() => navigate("community/celebration")}
          >
            عرض احتفال السبت
          </button>
        </div>
      )}
      {!draft && !error && <p role="status">جارٍ تحميل أدوات المالك…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className="text-btn"
            onClick={() => {
              setError("");
              setVersion((n) => n + 1);
            }}
          >
            تحديث حالة المعاينة
          </button>
        </div>
      )}
    </details>
  );
}
