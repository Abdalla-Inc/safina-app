// Static Pages demo cannot connect accounts, even with old browser preferences.
export const demoOnly = import.meta.env?.VITE_DEMO_ONLY === "true";
export const localPreviewEnabled =
  demoOnly ||
  import.meta.env?.DEV ||
  import.meta.env?.VITE_ENABLE_LOCAL_PREVIEW === "true";
export function initialAccountMode(savedMode) {
  return demoOnly
    ? "preview"
    : localPreviewEnabled
      ? savedMode || "preview"
      : "connected";
}
