/** Same-origin account API. Session and provider credentials never enter browser storage. */
let session = null;
let generation = 0;
let refreshPromise = null;
export class ApiError extends Error {
  constructor(message, code, status, detail) {
    super(message);
    Object.assign(this, { code, status, detail });
  }
}
export const currentSession = () => session;
export function clearSession() {
  generation++;
  session = null;
  refreshPromise = null;
}
export function acceptSession(value) {
  if (session?.memberId !== value.memberId) generation++;
  session = value;
  return value;
}
export async function request(
  path,
  { method = "GET", body, retry = true } = {},
) {
  const epoch = generation;
  let response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" && session
          ? { "X-CSRF-Token": session.csrfToken }
          : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(
      "الاتصال غير متاح. لم يؤكّد الخادم حفظ التعديل.",
      "NETWORK_ERROR",
      0,
    );
  }
  let value;
  try {
    value = await response.json();
  } catch {
    throw new ApiError(
      "خدمة الحسابات غير متاحة حالياً.",
      "INVALID_RESPONSE",
      response.status,
    );
  }
  if (epoch !== generation)
    throw new ApiError("تغيّر الحساب. أعد فتح الصفحة.", "SESSION_CHANGED", 401);
  if (
    response.status === 401 &&
    session &&
    retry &&
    !path.startsWith("/auth/")
  ) {
    if (!refreshPromise)
      refreshPromise = request("/auth/refresh", {
        method: "POST",
        body: {},
        retry: false,
      })
        .then(acceptSession)
        .finally(() => {
          refreshPromise = null;
        });
    try {
      await refreshPromise;
    } catch (error) {
      clearSession();
      globalThis.dispatchEvent?.(new Event("safina-session-expired"));
      throw error;
    }
    return request(path, { method, body, retry: false });
  }
  if (!response.ok)
    throw new ApiError(
      value.error?.message || "تعذّر إتمام الطلب.",
      value.error?.code || "REQUEST_FAILED",
      response.status,
      value.error,
    );
  return value;
}
export const mutation = (extra = {}) => ({
  mutationId: crypto.randomUUID(),
  ...extra,
});
export function occurrence(now = new Date()) {
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return {
    occurredAt: now.toISOString(),
    occurrenceDate: date,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utcOffsetMinutes: -now.getTimezoneOffset(),
  };
}
const prefix = "safina-connected-pending:";
export function pendingFor(memberId, storage = localStorage) {
  try {
    const list = JSON.parse(storage.getItem(prefix + memberId) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
export function keepPending(memberId, item, storage = localStorage) {
  const list = pendingFor(memberId, storage);
  if (!list.some((x) => x.body.mutationId === item.body.mutationId))
    list.push(item);
  storage.setItem(prefix + memberId, JSON.stringify(list));
}
export function removePending(memberId, id, storage = localStorage) {
  storage.setItem(
    prefix + memberId,
    JSON.stringify(
      pendingFor(memberId, storage).filter((x) => x.body.mutationId !== id),
    ),
  );
}
export function erasePrivateCache(storage = localStorage) {
  for (let i = storage.length - 1; i >= 0; i--) {
    const key = storage.key(i);
    if (key?.startsWith(prefix)) storage.removeItem(key);
  }
}
