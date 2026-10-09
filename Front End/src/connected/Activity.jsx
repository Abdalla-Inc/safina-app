import { chapters } from "../data/dailyActivity.js";
import { Plus } from "lucide-react";
import { CustomReadingModal } from "../features/daily/DailyActivity.jsx";
import { customWirdBatch, continueCustomWird } from "./customWird.js";
import { useState, useRef } from "react";
import { SmilePlus } from "lucide-react";
import { Button, Modal } from "../components/UI.jsx";
import { DailyPreferences } from "../components/DailyPreferences.jsx";
import { WirdCapsule } from "../pages/Today.jsx";
import { reactionOptions } from "../data/reactions.js";
import { ar } from "../context.jsx";
import {
  mutation,
  occurrence,
  request,
  keepPending,
} from "../services/connected.js";
import { useAccount } from "./context.js";

export function ConnectedPreferences({ me, onSaved }) {
  const [country, setCountry] = useState(me.countryCode || ""),
    [goal, setGoal] = useState(me.istighfarGoal || "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="connected-card connected-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          let current = me;
          if (country !== current.countryCode)
            current = await request("/me/profile", {
              method: "PATCH",
              body: mutation({
                expectedRevision: current.revision,
                countryCode: country,
              }),
            });
          if (Number(goal) !== current.istighfarGoal)
            await request("/me/istighfar-goal", {
              method: "PUT",
              body: mutation({
                expectedRevision: current.revision,
                istighfarGoal: Number(goal),
              }),
            });
          await onSaved();
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>
        {me.setupStatus === "required"
          ? "أكمل إعداد حسابك"
          : "البلد وهدف الاستغفار"}
      </h2>
      <p>
        يظهر البلد الذي تختاره بجانب اسمك في المجتمع. تعديل الهدف لا يغيّر هدف
        يوم سبق تسجيله.
      </p>
      <DailyPreferences
        country={country}
        goal={goal}
        onCountry={setCountry}
        onGoal={setGoal}
        required
      />
      {error && <p role="alert">{error}</p>}
      <Button disabled={busy}>حفظ التفضيلات</Button>
    </form>
  );
}

export function ConnectedDailyActivity({ data, write, busy, error }) {
  const [custom, setCustom] = useState(false);
  const batch = useRef(null);
  const account = useAccount();
  const dhikr = data.istighfar;
  const saveCount = (count) =>
    write(
      "/today/istighfar",
      "PUT",
      mutation({
        day: data.assignmentDay,
        expectedRevision: dhikr.revision,
        count,
        ...occurrence(),
      }),
    );
  return (
    <div className="daily-activity connected-daily-activity">
      <WirdCapsule
        row={{
          label: `استغفار ${ar(Math.max(dhikr.count, dhikr.target))} مرة`,
          total: dhikr.target,
          unit: "مرة",
        }}
        status={{
          count: dhikr.count,
          status: dhikr.complete
            ? "complete"
            : dhikr.count
              ? "partial"
              : "no_entry",
        }}
        disabled={busy}
        onChange={(done) =>
          saveCount(done ? Math.max(dhikr.count, dhikr.target) : 0)
        }
      />
      {(data.customReadings || [])
        .filter((x) => !x.retracted)
        .filter((x) => {
          const c = x.selection;
          return !(
            x.selectionIntact &&
            c.kind === "surah" &&
            c.fromAyah === 1 &&
            c.toAyah ===
              chapters.find((s) => s.id === c.surahId)?.total_verses &&
            data.componentStates.some(
              (r) =>
                r.status === "completed" &&
                r.id === (c.surahId === 2 ? "B" : c.surahId === 3 ? "I" : ""),
            )
          );
        })
        .map((x) => {
          const c = x.selection;
          const label =
            x.selectionIntact && c.kind === "juz"
              ? c.from === c.to
                ? `الجزء ${ar(c.from)}`
                : `الأجزاء ${ar(c.from)}–${ar(c.to)}`
              : x.selectionIntact && c.kind === "surah"
                ? `سورة ${chapters.find((s) => s.id === c.surahId)?.name || ar(c.surahId)}${c.fromAyah === 1 && c.toAyah === chapters.find((s) => s.id === c.surahId)?.total_verses ? "" : ` · ${ar(c.fromAyah)}–${ar(c.toAyah)}`}`
                : "قراءة مخصّصة";
          return (
            <WirdCapsule
              key={x.groupId}
              row={{ label, total: 1 }}
              status={{ count: 1, status: "complete" }}
              disabled={busy}
              onChange={() =>
                write(
                  `/custom-readings/${x.groupId}/retract`,
                  "POST",
                  mutation({
                    expectedRevision: x.revision,
                    reason: "سحب القراءة المخصّصة",
                  }),
                )
              }
            />
          );
        })}
      <div className="daily-secondary">
        <button
          className="wird-add"
          disabled={busy}
          onClick={() => {
            batch.current = null;
            setCustom(true);
          }}
        >
          <Plus size={16} />
          إضافة ورد مخصّص
        </button>
      </div>
      {custom && (
        <CustomReadingModal
          currentCount={dhikr.count}
          maxCount={account.me.capabilities?.istighfarBounds?.max || 1000000}
          externalError={error}
          onClose={() => setCustom(false)}
          onSave={async (selection) => {
            if (!batch.current)
              batch.current = customWirdBatch(data, selection);
            await continueCustomWird(batch.current, write);
            batch.current = null;
          }}
        />
      )}
    </div>
  );
}

export function ConnectedReactions({ card, busy, onReact }) {
  const [open, setOpen] = useState(false);
  const items = card.reactions || [];
  return (
    <div className="reaction-bar">
      {items.map(({ emoji, count }) => (
        <button
          type="button"
          className="emoji-reaction"
          key={emoji}
          disabled={busy || card.visibility !== "visible"}
          aria-label={reactionOptions.find((x) => x.emoji === emoji)?.label}
          aria-pressed={card.viewerReaction === emoji}
          onClick={() => onReact(card.viewerReaction === emoji ? null : emoji)}
        >
          {emoji} {ar(count)}
        </button>
      ))}
      <button
        type="button"
        className="emoji-reaction"
        aria-label="اختيار تفاعل"
        aria-expanded={open}
        disabled={busy || card.visibility !== "visible"}
        onClick={() => setOpen(!open)}
      >
        <SmilePlus size={18} aria-hidden="true" />
      </button>
      {open && (
        <div className="reaction-picker" role="group" aria-label="التفاعلات">
          {reactionOptions.map((x) => (
            <button
              type="button"
              key={x.emoji}
              aria-label={x.label}
              aria-pressed={card.viewerReaction === x.emoji}
              disabled={busy}
              onClick={async () => {
                await onReact(card.viewerReaction === x.emoji ? null : x.emoji);
                setOpen(false);
              }}
            >
              {x.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConnectedIstighfarCorrection({ value, onSaved }) {
  const { me } = useAccount();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!value) return null;
  return (
    <>
      <p>
        الاستغفار: {ar(value.count)} / {ar(value.target || me.istighfarGoal)}
      </p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        تصحيح استغفار هذا اليوم
      </Button>
      {open && (
        <Modal
          title={`استغفار ${value.day}`}
          onClose={() => !busy && setOpen(false)}
        >
          <form
            className="connected-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const body = mutation({
                day: value.day,
                count: Number(new FormData(e.currentTarget).get("count")),
                expectedRevision: value.revision,
                ...occurrence(
                  new Date(value.occurredAt || `${value.day}T12:00:00+03:00`),
                ),
              });
              try {
                await request("/today/istighfar", { method: "PUT", body });
                await onSaved();
                setOpen(false);
              } catch (e) {
                if (e.code === "NETWORK_ERROR") {
                  try {
                    keepPending(me.id, {
                      path: "/today/istighfar",
                      method: "PUT",
                      body,
                    });
                    dispatchEvent(new Event("safina-pending"));
                  } catch {
                    setError("تعذّر حفظ الطلب على الجهاز. أبقِ الصفحة مفتوحة.");
                    return;
                  }
                }
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              العدد الصحيح
              <input
                name="count"
                type="number"
                min="0"
                max={me.capabilities.istighfarBounds.max}
                step="1"
                required
                defaultValue={value.count}
              />
            </label>
            <p>يبقى التصحيح في اليوم الأصلي ويحافظ على هدفه المحفوظ.</p>
            {error && <p role="alert">{error}</p>}
            <Button disabled={busy}>حفظ التصحيح</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
