import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createHybridStore } from "./hybrid-store";

const schema = z.object({ value: z.string() });
const LOCAL_KEY = "gp_test_domain";
const SIDECAR_KEY = `${LOCAL_KEY}__sync`;
const ENDPOINT = "/api/state/test";

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  };
}

function okResponse(body: unknown = null) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

function errorResponse(status: number) {
  return {
    ok: false,
    status,
    json: async () => ({ error: "nope" }),
  } as Response;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createHybridStore", () => {
  it("writes the raw payload byte-identically and a dirty sidecar", () => {
    const { values, storage } = createMemoryStorage();
    const store = createHybridStore({
      localKey: LOCAL_KEY,
      schema,
      endpoint: ENDPOINT,
      storage,
      fetchImpl: vi.fn().mockResolvedValue(okResponse()),
      now: () => 1234,
    });

    store.writeLocal({ value: "hello" });

    expect(values.get(LOCAL_KEY)).toBe(JSON.stringify({ value: "hello" }));
    expect(JSON.parse(values.get(SIDECAR_KEY) as string)).toEqual({
      updatedAt: 1234,
      dirty: true,
    });
    expect(store.readLocal()).toEqual({
      updatedAt: 1234,
      data: { value: "hello" },
    });
  });

  it("pushes the envelope to Redis after the debounce window", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());
    const { storage } = createMemoryStorage();
    const store = createHybridStore({
      localKey: LOCAL_KEY,
      schema,
      endpoint: ENDPOINT,
      storage,
      fetchImpl,
      now: () => 1000,
      debounceMs: 800,
    });

    store.writeLocal({ value: "a" });
    expect(fetchImpl).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(800);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe("PUT");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body as string)).toEqual({
      updatedAt: 1000,
      data: { value: "a" },
    });
  });

  it("adopts a remote value without pushing it back", () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());
    const { values, storage } = createMemoryStorage();
    const store = createHybridStore({
      localKey: LOCAL_KEY,
      schema,
      endpoint: ENDPOINT,
      storage,
      fetchImpl,
    });

    store.acceptRemote({ updatedAt: 42, data: { value: "remote" } });

    expect(store.readLocal()).toEqual({
      updatedAt: 42,
      data: { value: "remote" },
    });
    expect(JSON.parse(values.get(SIDECAR_KEY) as string).dirty).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("pulls and validates a remote envelope", async () => {
    const { storage } = createMemoryStorage();
    const store = createHybridStore({
      localKey: LOCAL_KEY,
      schema,
      endpoint: ENDPOINT,
      storage,
      fetchImpl: vi
        .fn()
        .mockResolvedValue(okResponse({ updatedAt: 7, data: { value: "x" } })),
    });

    expect(await store.pull()).toEqual({ updatedAt: 7, data: { value: "x" } });
  });

  it("returns null from pull on a miss, an invalid body, or a network error", async () => {
    const { storage } = createMemoryStorage();
    const make = (impl: () => Promise<Response>) =>
      createHybridStore({
        localKey: LOCAL_KEY,
        schema,
        endpoint: ENDPOINT,
        storage,
        fetchImpl: vi.fn(impl),
      });

    expect(await make(async () => okResponse(null)).pull()).toBeNull();
    expect(
      await make(async () =>
        okResponse({ updatedAt: 1, data: { value: 5 } }),
      ).pull(),
    ).toBeNull();
    expect(await make(async () => errorResponse(404)).pull()).toBeNull();
    expect(
      await make(() => Promise.reject(new Error("offline"))).pull(),
    ).toBeNull();
  });

  it("flushDirty clears the dirty flag only on a successful push", async () => {
    const { values, storage } = createMemoryStorage();
    const failing = createHybridStore({
      localKey: LOCAL_KEY,
      schema,
      endpoint: ENDPOINT,
      storage,
      fetchImpl: vi.fn().mockResolvedValue(errorResponse(503)),
      now: () => 900,
    });

    failing.writeLocal({ value: "pending" });
    await failing.flushDirty();
    expect(JSON.parse(values.get(SIDECAR_KEY) as string).dirty).toBe(true);

    const ok = createHybridStore({
      localKey: LOCAL_KEY,
      schema,
      endpoint: ENDPOINT,
      storage,
      fetchImpl: vi.fn().mockResolvedValue(okResponse()),
    });
    await ok.flushDirty();
    expect(JSON.parse(values.get(SIDECAR_KEY) as string).dirty).toBe(false);
  });

  it("does not push when there is nothing dirty", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());
    const { storage } = createMemoryStorage();
    const store = createHybridStore({
      localKey: LOCAL_KEY,
      schema,
      endpoint: ENDPOINT,
      storage,
      fetchImpl,
    });

    await store.flushDirty();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("clears corrupt local data and treats legacy data as oldest", () => {
    const { values, storage } = createMemoryStorage();
    const store = createHybridStore({
      localKey: LOCAL_KEY,
      schema,
      endpoint: ENDPOINT,
      storage,
      fetchImpl: vi.fn(),
    });

    values.set(LOCAL_KEY, JSON.stringify({ value: 999 }));
    expect(store.readLocal()).toBeNull();
    expect(values.has(LOCAL_KEY)).toBe(false);

    // Raw payload written by the old code, no sidecar → updatedAt 0.
    values.set(LOCAL_KEY, JSON.stringify({ value: "legacy" }));
    expect(store.readLocal()).toEqual({
      updatedAt: 0,
      data: { value: "legacy" },
    });
  });
});
