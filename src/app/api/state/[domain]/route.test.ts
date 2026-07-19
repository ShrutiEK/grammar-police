import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// Real getState/putState/touchActive run against an in-memory StateRedis; only
// the client factory is swapped so the route is exercised end-to-end.
const memory = vi.hoisted(() => {
  const values = new Map<string, unknown>();
  const zsets = new Map<string, Map<string, number>>();
  const zsetFor = (key: string) => {
    const existing = zsets.get(key);
    if (existing) return existing;
    const created = new Map<string, number>();
    zsets.set(key, created);
    return created;
  };
  const redis = {
    async readJson(key: string) {
      return values.has(key) ? values.get(key) : null;
    },
    async writeJson(
      key: string,
      value: unknown,
      options?: { ttlSeconds?: number; onlyIfAbsent?: boolean },
    ) {
      if (options?.onlyIfAbsent && values.has(key)) return;
      values.set(key, value);
    },
    async readManyJson(keys: string[]) {
      return keys.map((key) => (values.has(key) ? values.get(key) : null));
    },
    async addToIndex(key: string, score: number, member: string) {
      zsetFor(key).set(member, score);
    },
    async rangeByScore() {
      return [];
    },
    async countByScore() {
      return 0;
    },
    async removeRangeByScore() {},
    async removeMembers(key: string, members: string[]) {
      const set = zsetFor(key);
      for (const member of members) set.delete(member);
    },
    async deleteKeys(keys: string[]) {
      for (const key of keys) {
        values.delete(key);
        zsets.delete(key);
      }
    },
  };
  return { values, zsets, redis, configured: true };
});

vi.mock("@/integrations/redis/redis.client", async (importActual) => {
  const actual =
    await importActual<typeof import("@/integrations/redis/redis.client")>();
  return {
    ...actual,
    getRedis: () => memory.redis,
    isStateStoreConfigured: () => memory.configured,
  };
});

import { demoLessonAssessment } from "@/features/lesson/demo-assessment";
import { SESSION_COOKIE_NAME } from "@/features/state-sync/session";
import { SESSION_INDEX_KEY, redisKey } from "@/integrations/redis/redis.client";

import { DELETE, GET, PUT } from "./route";

const SID = "sid-1";

const validSession = {
  selectedPictureFilename: "beach.png" as const,
  focusTopic: null,
  questionsAndAnswers: [
    {
      number: 1,
      question: "Can you describe what you see in this picture?",
      answer: null,
      answerMode: null,
      assessment: null,
    },
  ],
};

function makeRequest(
  domain: string,
  options: {
    method?: "GET" | "PUT" | "DELETE";
    cookie?: string | null;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
) {
  const { method = "GET", cookie = SID, body, headers = {} } = options;
  const requestHeaders = new Headers(headers);
  if (cookie) {
    requestHeaders.set("cookie", `${SESSION_COOKIE_NAME}=${cookie}`);
  }
  if (body !== undefined) {
    requestHeaders.set("content-type", "application/json");
  }
  const request = new NextRequest(`https://example.com/api/state/${domain}`, {
    method,
    headers: requestHeaders,
    ...(body !== undefined
      ? { body: typeof body === "string" ? body : JSON.stringify(body) }
      : {}),
  });
  const context = { params: Promise.resolve({ domain }) };
  return { request, context };
}

beforeEach(() => {
  memory.values.clear();
  memory.zsets.clear();
  memory.configured = true;
});

describe("/api/state/[domain]", () => {
  it("rejects requests without a session cookie", async () => {
    const { request, context } = makeRequest("session", { cookie: null });
    const response = await GET(request, context);
    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown domain", async () => {
    const { request, context } = makeRequest("nonsense");
    const response = await GET(request, context);
    expect(response.status).toBe(404);
  });

  it("write-through stores the envelope, indexes the session, and captures meta", async () => {
    const envelope = { updatedAt: 1000, data: validSession };
    const { request, context } = makeRequest("session", {
      method: "PUT",
      body: envelope,
      headers: {
        "x-forwarded-for": "203.0.113.7, 10.0.0.1",
        "x-vercel-ip-country": "IN",
        "x-vercel-ip-city": "Bengaluru",
        "user-agent": "Test/1.0",
      },
    });

    const response = await PUT(request, context);

    expect(response.status).toBe(204);
    expect(memory.values.get(redisKey.session(SID))).toEqual(envelope);
    expect(memory.zsets.get(SESSION_INDEX_KEY)?.get(SID)).toBe(1000);
    expect(memory.values.get(redisKey.meta(SID))).toMatchObject({
      ip: "203.0.113.7",
      country: "IN",
      city: "Bengaluru",
      userAgent: "Test/1.0",
      createdAt: 1000,
    });
  });

  it("round-trips a stored value on GET", async () => {
    const envelope = { updatedAt: 5, data: validSession };
    const put = makeRequest("session", { method: "PUT", body: envelope });
    await PUT(put.request, put.context);

    const { request, context } = makeRequest("session");
    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(envelope);
  });

  it("binds each domain to its own schema (lesson=loose accepts, feedback=strict rejects)", async () => {
    const lessonBody = { updatedAt: 1, data: demoLessonAssessment };

    const lesson = makeRequest("lesson", { method: "PUT", body: lessonBody });
    expect((await PUT(lesson.request, lesson.context)).status).toBe(204);

    // The same bare-assessment payload is invalid for the strict feedback shape.
    const feedback = makeRequest("feedback", {
      method: "PUT",
      body: lessonBody,
    });
    expect((await PUT(feedback.request, feedback.context)).status).toBe(400);
    expect(memory.values.get(redisKey.feedbackLatest(SID))).toBeUndefined();
  });

  it("rejects a malformed payload with 400", async () => {
    const { request, context } = makeRequest("session", {
      method: "PUT",
      body: { updatedAt: 2, data: { selectedPictureFilename: "nope.png" } },
    });
    expect((await PUT(request, context)).status).toBe(400);
  });

  it("does not let a stale write clobber a newer value (last-write-wins)", async () => {
    const put = (updatedAt: number) => {
      const { request, context } = makeRequest("session", {
        method: "PUT",
        body: { updatedAt, data: validSession },
      });
      return PUT(request, context);
    };
    const storedUpdatedAt = () =>
      (memory.values.get(redisKey.session(SID)) as { updatedAt: number })
        .updatedAt;

    await put(200);
    await put(100); // stale, out-of-order → ignored, not an error
    expect(storedUpdatedAt()).toBe(200);

    await put(300); // newer → wins
    expect(storedUpdatedAt()).toBe(300);
  });

  it("erases all of the caller's session data on DELETE", async () => {
    const put = makeRequest("session", {
      method: "PUT",
      body: { updatedAt: 1, data: validSession },
    });
    await PUT(put.request, put.context);
    expect(memory.values.get(redisKey.session(SID))).toBeDefined();
    expect(memory.values.get(redisKey.meta(SID))).toBeDefined();

    const del = makeRequest("session", { method: "DELETE" });
    const response = await DELETE(del.request);

    expect(response.status).toBe(204);
    expect(memory.values.get(redisKey.session(SID))).toBeUndefined();
    expect(memory.values.get(redisKey.meta(SID))).toBeUndefined();
  });

  it("rejects DELETE without a session cookie", async () => {
    const del = makeRequest("session", { method: "DELETE", cookie: null });
    expect((await DELETE(del.request)).status).toBe(400);
  });

  it("degrades to a quiet no-op when no store is configured (preview/staging)", async () => {
    memory.configured = false;

    const get = makeRequest("session");
    const getResponse = await GET(get.request, get.context);
    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toBeNull();

    const put = makeRequest("session", {
      method: "PUT",
      body: { updatedAt: 1, data: validSession },
    });
    const putResponse = await PUT(put.request, put.context);
    expect(putResponse.status).toBe(204);
    expect(memory.values.get(redisKey.session(SID))).toBeUndefined();

    const del = makeRequest("session", { method: "DELETE" });
    expect((await DELETE(del.request)).status).toBe(204);
  });
});
