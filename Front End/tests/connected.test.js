import test from "node:test";
import assert from "node:assert/strict";
import {
  request,
  acceptSession,
  clearSession,
  keepPending,
  pendingFor,
  removePending,
  erasePrivateCache,
  occurrence,
} from "../src/services/connected.js";
const response = (status, value) => ({
  ok: status < 400,
  status,
  json: async () => value,
});
function storage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i],
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
}
test("account reading queues are isolated, deduplicated, and cleared without touching preview data", () => {
  const store = storage();
  store.setItem("preview-state", "unchanged");
  const item = {
    path: "/today/partial",
    method: "POST",
    body: { mutationId: "fixed", occurredAt: "2026-09-30T21:00:00Z" },
  };
  keepPending("one", item, store);
  keepPending("one", item, store);
  assert.equal(pendingFor("one", store).length, 1);
  assert.deepEqual(pendingFor("two", store), []);
  assert.equal(
    pendingFor("one", store)[0].body.occurredAt,
    item.body.occurredAt,
  );
  removePending("one", "fixed", store);
  assert.deepEqual(pendingFor("one", store), []);
  keepPending("two", item, store);
  erasePrivateCache(store);
  assert.equal(store.getItem("preview-state"), "unchanged");
  assert.equal(store.length, 1);
});
test("cookie requests keep CSRF in memory and use the same mutation when refreshing an expired session", async () => {
  const original = globalThis.fetch;
  const calls = [];
  acceptSession({ memberId: "one", csrfToken: "old" });
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? response(401, { error: { code: "UNAUTHORIZED" } })
      : calls.length === 2
        ? response(200, { memberId: "one", csrfToken: "new" })
        : response(200, { accepted: true });
  };
  try {
    const body = { mutationId: "persistent", completed: true };
    assert.deepEqual(
      await request("/today/components/B", { method: "PUT", body }),
      { accepted: true },
    );
    assert.equal(calls[0].options.credentials, "same-origin");
    assert.equal(calls[0].options.headers["X-CSRF-Token"], "old");
    assert.equal(calls[1].url, "/api/v1/auth/refresh");
    assert.equal(calls[2].options.headers["X-CSRF-Token"], "new");
    assert.equal(calls[0].options.body, calls[2].options.body);
  } finally {
    globalThis.fetch = original;
    clearSession();
  }
});
test("responses from an old account cannot populate the next account", async () => {
  const original = globalThis.fetch;
  let finish;
  acceptSession({ memberId: "one", csrfToken: "one" });
  globalThis.fetch = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const pending = request("/me");
  clearSession();
  acceptSession({ memberId: "two", csrfToken: "two" });
  finish(response(200, { id: "one" }));
  try {
    await assert.rejects(pending, { code: "SESSION_CHANGED" });
  } finally {
    globalThis.fetch = original;
    clearSession();
  }
});
test("network failures do not report an unacknowledged mutation as saved", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw Error("offline");
  };
  try {
    await assert.rejects(
      request("/today/partial", {
        method: "POST",
        body: { mutationId: "same" },
      }),
      { code: "NETWORK_ERROR", status: 0 },
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("occurrence retains a real instant and the original device offset independently of assignment day", () => {
  const date = new Date("2026-09-30T21:30:00Z");
  const value = occurrence(date);
  assert.equal(value.occurredAt, "2026-09-30T21:30:00.000Z");
  assert.equal(value.utcOffsetMinutes, -date.getTimezoneOffset());
  assert.ok(value.timezone);
  assert.equal("assignmentDay" in value, false);
});

test("same-member session rotation does not invalidate an in-flight read", async () => {
  const original = globalThis.fetch;
  let finish;
  acceptSession({ memberId: "one", csrfToken: "old" });
  globalThis.fetch = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const pending = request("/reader");
  acceptSession({ memberId: "one", csrfToken: "rotated" });
  finish(response(200, { page: 604 }));
  try {
    assert.deepEqual(await pending, { page: 604 });
  } finally {
    globalThis.fetch = original;
    clearSession();
  }
});
