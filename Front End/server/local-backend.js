import { readFile } from "node:fs/promises";
const allowed = new Set([
  "/health",
  "/today",
  "/calendar",
  "/ship-progress",
  "/khatmas",
  "/quran/reference",
  "/program-rules",
]);
export function localBackendBridge() {
  return {
    name: "safina-local-read-bridge",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/local", async (req, res) => {
        const send = (status, value) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.end(JSON.stringify(value));
        };
        const url = new URL(req.url, "http://127.0.0.1");
        if (req.method !== "GET")
          return send(405, { error: { code: "READ_ONLY_BRIDGE" } });
        if (
          req.headers["x-safina-preview"] !== "1" ||
          (req.headers.origin &&
            !["http://localhost:5178", "http://127.0.0.1:5178"].includes(
              req.headers.origin,
            ))
        )
          return send(403, { error: { code: "LOCAL_PREVIEW_ONLY" } });
        if (!allowed.has(url.pathname))
          return send(404, { error: { code: "ENDPOINT_NOT_CONNECTED" } });
        try {
          const credentials = JSON.parse(
            await readFile(
              new URL("../../Back End/local/demo-access.json", import.meta.url),
              "utf8",
            ),
          );
          if (
            credentials.synthetic !== true ||
            !credentials.members?.["demo-BJ2"]
          )
            return send(503, {
              error: { code: "SYNTHETIC_ACCOUNT_NOT_CONFIGURED" },
            });
          const response = await fetch(
            `http://127.0.0.1:8765${url.pathname}${url.search}`,
            {
              headers: {
                Authorization: `Bearer ${credentials.members["demo-BJ2"]}`,
              },
              signal: AbortSignal.timeout(8000),
              redirect: "error",
            },
          );
          const body = await response.json();
          return send(response.status, body);
        } catch {
          return send(503, { error: { code: "BACKEND_UNAVAILABLE" } });
        }
      });
    },
  };
}
