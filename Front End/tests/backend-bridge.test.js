import test from "node:test";
import assert from "node:assert/strict";
import { localBackendBridge } from "../server/local-backend.js";
test("local backend bridge rejects writes, unlisted paths and cross-origin requests before connecting", async () => {
  let handler;
  localBackendBridge().configureServer({
    middlewares: {
      use: (prefix, fn) => {
        assert.equal(prefix, "/api/local");
        handler = fn;
      },
    },
  });
  const calls = [
    [
      {
        method: "POST",
        url: "/reading-acts",
        headers: { "x-safina-preview": "1" },
      },
      405,
      "READ_ONLY_BRIDGE",
    ],
    [{ method: "GET", url: "/health", headers: {} }, 403, "LOCAL_PREVIEW_ONLY"],
    [
      {
        method: "GET",
        url: "/health",
        headers: {
          "x-safina-preview": "1",
          origin: "https://unrelated.example",
        },
      },
      403,
      "LOCAL_PREVIEW_ONLY",
    ],
    [
      { method: "GET", url: "/events", headers: { "x-safina-preview": "1" } },
      404,
      "ENDPOINT_NOT_CONNECTED",
    ],
  ];
  for (const [req, status, code] of calls) {
    const result = {
      setHeader() {},
      end(body) {
        this.body = JSON.parse(body);
      },
    };
    await handler(req, result);
    assert.equal(result.statusCode, status);
    assert.equal(result.body.error.code, code);
  }
});
