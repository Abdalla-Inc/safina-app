// Production always enters authenticated mode unless the host explicitly enables
// the isolated local design preview. This is UX configuration, never authorization.
export const localPreviewEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOCAL_PREVIEW === "true";
