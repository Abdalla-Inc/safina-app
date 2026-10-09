import {
  demoOnly,
  initialAccountMode,
  localPreviewEnabled,
} from "./launchConfig.js";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  request,
  acceptSession,
  clearSession,
  erasePrivateCache,
} from "../services/connected.js";
import { AccountContext as Context } from "./context.js";
export function AccountProvider({ children }) {
  const [mode, setMode] = useState(() =>
    initialAccountMode(localStorage.getItem("safina-mode")),
  );
  const [session, setSession] = useState(null),
    [me, setMe] = useState(null),
    [context, setContext] = useState(null);
  const [status, setStatus] = useState("loading"),
    [error, setError] = useState("");
  const epoch = useRef(0);
  const reload = useCallback(async () => {
    if (demoOnly) return;
    const current = epoch.current;
    const [profile, day] = await Promise.all([
      request("/me"),
      request("/community/context"),
    ]);
    if (current === epoch.current) {
      setMe(profile);
      setContext(day);
    }
  }, []);
  const discard = useCallback((erase = true) => {
    epoch.current++;
    clearSession();
    if (erase) erasePrivateCache();
    setSession(null);
    setMe(null);
    setContext(null);
    setStatus("signed_out");
    if (!localPreviewEnabled) setMode("connected");
  }, []);
  const signIn = async (value) => {
    if (demoOnly) return;
    acceptSession(value);
    setSession(value);
    await reload();
    setStatus("ready");
    setMode("connected");
    localStorage.setItem("safina-mode", "connected");
    localStorage.setItem("safina-account-event", crypto.randomUUID());
  };
  const load = useCallback(async () => {
    if (demoOnly) return;
    setError("");
    setStatus("loading");
    try {
      const value = await request("/auth/session");
      acceptSession(value);
      setSession(value);
      await reload();
      setStatus("ready");
    } catch (err) {
      if (err.status === 401) discard(false);
      else {
        setError(err.message);
        setStatus("unavailable");
      }
    }
  }, [reload, discard]);
  useEffect(() => {
    if (mode === "connected") load();
    else setStatus("signed_out");
  }, [mode, load]);
  useEffect(() => {
    const expired = () => discard(false);
    const changed = (e) => {
      if (!demoOnly && e.key === "safina-account-event") {
        discard();
        if (localStorage.getItem("safina-mode") === "connected") load();
      }
    };
    addEventListener("safina-session-expired", expired);
    addEventListener("storage", changed);
    return () => {
      removeEventListener("safina-session-expired", expired);
      removeEventListener("storage", changed);
    };
  }, [discard, load]);
  useEffect(() => {
    if (status !== "ready" || mode !== "connected") return;
    const refresh = () => {
      if (!document.hidden) reload().catch((e) => setError(e.message));
    };
    const timer = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [status, mode, reload]);
  const chooseMode = (value) => {
    if (demoOnly) return;
    if (
      value === "preview" &&
      !localPreviewEnabled &&
      me?.permissions?.superAdmin !== true
    )
      return;
    setMode(value);
    localStorage.setItem("safina-mode", value);
  };
  const logout = async () => {
    await request("/auth/logout", { method: "POST", body: {} });
    discard();
    localStorage.setItem("safina-account-event", crypto.randomUUID());
  };
  return (
    <Context.Provider
      value={{
        mode,
        localPreviewEnabled:
          localPreviewEnabled || me?.permissions?.superAdmin === true,
        chooseMode,
        session,
        me,
        context,
        status,
        error,
        reload,
        load,
        signIn,
        logout,
        discard,
      }}
    >
      {children}
    </Context.Provider>
  );
}
