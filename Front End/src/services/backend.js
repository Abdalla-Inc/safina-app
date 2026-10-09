export async function backendGet(path, signal) {
  const response = await fetch(`/api/local${path}`, {
    headers: { "X-Safina-Preview": "1" },
    cache: "no-store",
    signal,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error("BACKEND_UNAVAILABLE");
  }
  if (!response.ok) throw Error(data.error?.code || "BACKEND_UNAVAILABLE");
  return data;
}
export async function loadJourney(month, signal) {
  const [year, number] = month.split("-").map(Number);
  const last = new Date(year, number, 0).getDate();
  const [health, calendar, ship, khatmas] = await Promise.all([
    backendGet("/health", signal),
    backendGet(`/calendar?start=${month}-01&end=${month}-${last}`, signal),
    backendGet("/ship-progress", signal),
    backendGet("/khatmas", signal),
  ]);
  if (
    health.contractVersion !== "0.3.0" ||
    !Array.isArray(calendar.days) ||
    !Array.isArray(khatmas.cycles) ||
    !Number.isFinite(ship.approvedCredits)
  )
    throw Error("UNSUPPORTED_CONTRACT");
  return { calendar, ship, khatmas, contractVersion: health.contractVersion };
}

// Display vocabulary only; authoritative credit and coverage remain untouched.
export function backendReadingStatus(status) {
  const mapping = {
    completed: "complete",
    partial: "partial",
    recorded_awaiting_policy: "recorded_awaiting_policy",
    no_entry: "no_entry",
    free_day: "free_day",
    supplemental_only: "supplemental",
    awaiting_policy: "awaiting_policy",
  };
  return mapping[status] || "unknown";
}
