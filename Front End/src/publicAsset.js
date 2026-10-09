// Vite supplies the deployment prefix; Node-based data tests use the root.
export function publicAsset(path, base = import.meta.env?.BASE_URL || "/") {
  if (/^(?:[a-z]+:|\/\/)/i.test(path)) return path;
  if (base !== "/" && path.startsWith(base)) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
