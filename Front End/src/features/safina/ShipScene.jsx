import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ar } from "../../context.jsx";
import "./safina.css";

export function ShipScene({
  visual,
  reducedMotion = false,
  weather = "breeze",
  preview = false,
}) {
  const container = useRef(null),
    scene = useRef(null),
    latest = useRef(null);
  const [osReduced, setOsReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [paused, setPaused] = useState(false),
    [error, setError] = useState(false),
    [ready, setReady] = useState(false),
    [retry, setRetry] = useState(0);
  const stopped = paused || reducedMotion || osReduced;
  latest.current = { visual, stopped, weather };
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = (e) => setOsReduced(e.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const present = !!visual;
  useEffect(() => {
    if (!present) return;
    let cancelled = false,
      instance;
    setReady(false);
    setError(false);
    import("./renderer/scene.js")
      .then(({ createScene }) => {
        if (cancelled) return;
        instance = createScene(container.current, {
          reducedMotion: latest.current.stopped,
          moonUrl: `${import.meta.env.BASE_URL}assets/moon-lroc-2k.jpg`,
          onError: () => {
            if (!cancelled) {
              setError(true);
              instance?.setPaused(true);
            }
          },
        });
        if (cancelled) {
          instance.dispose();
          return;
        }
        scene.current = instance;
        const { visual: v, stopped: stop, weather: w } = latest.current;
        instance.setState(v.buildStep, v.health, { instant: true });
        instance.setWeather(w);
        instance.setPaused(stop);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      instance?.dispose();
      scene.current = null;
    };
  }, [present, retry]);
  useEffect(() => {
    if (!scene.current || !visual) return;
    scene.current.setState(visual.buildStep, visual.health, {
      instant: stopped,
    });
  }, [visual?.buildStep, visual?.health]);
  useEffect(() => {
    scene.current?.setPaused(stopped);
  }, [stopped]);
  useEffect(() => {
    scene.current?.setWeather(weather);
  }, [weather]);
  const caption = !visual
    ? "حالة السفينة بانتظار اعتماد الخادم"
    : visual.phase === "maintenance"
      ? `حالة السفينة ${ar(visual.health)}٪`
      : `بناء السفينة ${ar(visual.buildStep)} من ٣٠`;
  return (
    <section className="safina-scene" aria-label="سفينة النور">
      <div
        className="safina-viewport"
        ref={container}
        role="img"
        aria-label={caption}
      />
      <div className="safina-scene-caption">
        <span>{preview ? "معاينة السفينة" : "سفينتك"}</span>
        <strong aria-live="polite">{caption}</strong>
      </div>
      {!visual ? (
        <div className="safina-fallback">
          <p>سيظهر بناء سفينتك وحالتها هنا بعد اعتماد بياناتها.</p>
        </div>
      ) : error ? (
        <div className="safina-fallback" role="status">
          <p>تعذّر عرض المشهد ثلاثي الأبعاد.</p>
          <button onClick={() => setRetry((n) => n + 1)}>إعادة المحاولة</button>
        </div>
      ) : (
        !ready && (
          <div className="safina-fallback" role="status">
            جارٍ تجهيز سفينتك…
          </div>
        )
      )}
      {visual && (
        <div className="safina-controls" aria-label="أدوات عرض السفينة">
          <button
            onClick={() => scene.current?.rotate(1)}
            disabled={!ready || error}
            aria-label="تدوير السفينة يمينًا"
          >
            <ChevronRight size={17} />
          </button>
          <button
            onClick={() => scene.current?.rotate(-1)}
            disabled={!ready || error}
            aria-label="تدوير السفينة يسارًا"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => scene.current?.resetCamera()}
            disabled={!ready || error}
            aria-label="إعادة زاوية العرض"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setPaused((v) => !v)}
            disabled={reducedMotion || osReduced || !ready || error}
            aria-label={stopped ? "تشغيل حركة السفينة" : "إيقاف حركة السفينة"}
            aria-pressed={stopped}
          >
            {stopped ? <Play size={17} /> : <Pause size={17} />}
          </button>
        </div>
      )}
    </section>
  );
}
