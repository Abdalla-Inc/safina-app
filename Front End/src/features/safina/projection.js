export const SHIP_ASSET_VERSION = "0.5.0";
function instant(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
function civilDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function validateShipProjection(value) {
  if (
    !value ||
    value.schemaVersion !== "1.0.0-proposed" ||
    value.assetVersion !== SHIP_ASSET_VERSION ||
    value.lifecyclePolicyId !== "founder-ship-lifecycle-2026-10-01.v1" ||
    typeof value.vesselId !== "string" ||
    !value.vesselId ||
    !Number.isInteger(value.revision) ||
    value.revision < 0 ||
    !instant(value.generatedAt) ||
    !Array.isArray(value.blockedReasons) ||
    !value.blockedReasons.every(
      (reason) => typeof reason === "string" && reason.trim(),
    ) ||
    new Set(value.blockedReasons).size !== value.blockedReasons.length
  )
    throw Error("INVALID_SHIP_PROJECTION");
  if (
    value.status === "awaiting_policy" &&
    value.state === null &&
    value.blockedReasons.length
  )
    return value;
  const s = value.state;
  if (
    value.status !== "ready" ||
    value.blockedReasons.length ||
    !s ||
    !Number.isInteger(s.buildStep) ||
    s.buildStep < 0 ||
    s.buildStep > 30 ||
    !Number.isInteger(s.health) ||
    s.health < 0 ||
    s.health > 100
  )
    throw Error("INVALID_SHIP_PROJECTION");
  try {
    new Intl.DateTimeFormat("en", { timeZone: s.maintenanceTimezone }).format();
  } catch {
    throw Error("INVALID_SHIP_PROJECTION");
  }
  if (typeof s.maintenanceTimezone !== "string" || !s.maintenanceTimezone)
    throw Error("INVALID_SHIP_PROJECTION");
  if (s.phase === "construction") {
    if (
      s.buildStep > 29 ||
      s.health !== 100 ||
      s.nextSettlementAt !== null ||
      s.lastSettledMaintenanceDate !== null
    )
      throw Error("INVALID_SHIP_PROJECTION");
  } else if (s.phase === "maintenance") {
    if (
      s.buildStep !== 30 ||
      !instant(s.nextSettlementAt) ||
      (s.lastSettledMaintenanceDate !== null &&
        !civilDate(s.lastSettledMaintenanceDate))
    )
      throw Error("INVALID_SHIP_PROJECTION");
  } else throw Error("INVALID_SHIP_PROJECTION");
  return value;
}
export function acceptShipProjection(previous, incoming) {
  const next = validateShipProjection(incoming);
  if (previous && next.vesselId !== previous.vesselId)
    throw Error("VESSEL_CHANGED");
  return previous && next.revision <= previous.revision ? previous : next;
}
