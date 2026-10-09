import { useEffect, useRef, useState } from "react";
import { request } from "../../services/connected.js";
import { acceptShipProjection } from "./projection.js";

export function useShipVisual(memberId, day, refresh) {
  const [result, setResult] = useState({
    owner: null,
    status: "loading",
    projection: null,
  });
  const sequence = useRef(0);
  useEffect(() => {
    let active = true;
    setResult((previous) =>
      previous.owner === memberId
        ? previous
        : { owner: memberId, status: "loading", projection: null },
    );
    async function load() {
      const call = ++sequence.current;
      try {
        const incoming = await request("/ship-visual-state");
        if (!active || call !== sequence.current) return;
        // Validate before scheduling state so invalid responses are caught here.
        acceptShipProjection(null, incoming);
        setResult((previous) => {
          try {
            const projection = acceptShipProjection(
              previous.owner === memberId ? previous.projection : null,
              incoming,
            );
            return { owner: memberId, status: projection.status, projection };
          } catch {
            return { owner: memberId, status: "error", projection: null };
          }
        });
      } catch (error) {
        if (!active || call !== sequence.current) return;
        setResult((previous) => ({
          owner: memberId,
          status: error.status === 404 ? "unavailable" : "error",
          // Never turn unavailable policy/health into a fabricated healthy ship.
          projection:
            previous.owner === memberId && error.status !== 404
              ? previous.projection
              : null,
        }));
      }
    }
    load();
    const resume = () => {
      if (!document.hidden) load();
    };
    const timer = setInterval(resume, 30000);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [memberId, day, refresh]);
  return result.owner === memberId
    ? result
    : { status: "loading", projection: null };
}
