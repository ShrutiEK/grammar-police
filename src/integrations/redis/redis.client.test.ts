import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

import {
  DEFAULT_TTL_SECONDS,
  countActiveSessions,
  getState,
  listActiveSessionIds,
  putState,
  readSessionState,
  redisKey,
  touchActive,
  trimActiveIndex,
  type StateRedis,
} from "./redis.client";

type WriteCall = {
  key: string;
  value: unknown;
  ttlSeconds?: number;
  onlyIfAbsent?: boolean;
};

function createMemoryStateRedis() {
  const values = new Map<string, unknown>();
  const zsets = new Map<string, Map<string, number>>();
  const writes: WriteCall[] = [];

  const zsetFor = (key: string) => {
    const existing = zsets.get(key);
    if (existing) {
      return existing;
    }
    const created = new Map<string, number>();
    zsets.set(key, created);
    return created;
  };

  const redis: StateRedis = {
    async readJson<T>(key: string) {
      return values.has(key) ? (values.get(key) as T) : null;
    },
    async writeJson(key, value, options) {
      writes.push({
        key,
        value,
        ttlSeconds: options?.ttlSeconds,
        onlyIfAbsent: options?.onlyIfAbsent,
      });
      if (options?.onlyIfAbsent && values.has(key)) {
        return;
      }
      values.set(key, value);
    },
    async readManyJson<T>(keys: string[]) {
      return keys.map((key) =>
        values.has(key) ? (values.get(key) as T) : null,
      );
    },
    async addToIndex(key, score, member) {
      zsetFor(key).set(member, score);
    },
    async rangeByScore(key, min, max, options) {
      const members = [...zsetFor(key).entries()]
        .filter(([, score]) => score >= min && score <= max)
        .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
        .map(([member]) => member);
      if (options?.offset !== undefined && options?.count !== undefined) {
        return members.slice(options.offset, options.offset + options.count);
      }
      return members;
    },
    async countByScore(key, min, max) {
      return [...zsetFor(key).values()].filter(
        (score) => score >= min && score <= max,
      ).length;
    },
    async removeRangeByScore(key, min, max) {
      const set = zsetFor(key);
      for (const [member, score] of [...set.entries()]) {
        if (score >= min && score <= max) {
          set.delete(member);
        }
      }
    },
    async removeMembers(key, members) {
      const set = zsetFor(key);
      for (const member of members) {
        set.delete(member);
      }
    },
    async deleteKeys(keys) {
      for (const key of keys) {
        values.delete(key);
        zsets.delete(key);
      }
    },
  };

  return { redis, values, writes };
}

const envelopeSchema = z.object({
  updatedAt: z.number(),
  data: z.object({ focusTopic: z.string().nullable() }),
});

describe("redis state helpers", () => {
  it("round-trips a validated envelope", async () => {
    const { redis } = createMemoryStateRedis();
    const key = redisKey.session("sid-1");
    const envelope = { updatedAt: 100, data: { focusTopic: "animals" } };

    await putState(key, envelope, {}, redis);

    expect(await getState(key, envelopeSchema, redis)).toEqual(envelope);
  });

  it("returns null on a miss and on schema drift", async () => {
    const { redis } = createMemoryStateRedis();
    const key = redisKey.session("sid-1");

    expect(await getState(key, envelopeSchema, redis)).toBeNull();

    await putState(key, { unexpected: true }, {}, redis);
    expect(await getState(key, envelopeSchema, redis)).toBeNull();
  });

  it("applies the default TTL and honours onlyIfAbsent", async () => {
    const { redis, values, writes } = createMemoryStateRedis();
    const key = redisKey.meta("sid-1");

    await putState(key, { first: true }, { onlyIfAbsent: true }, redis);
    await putState(key, { second: true }, { onlyIfAbsent: true }, redis);

    expect(values.get(key)).toEqual({ first: true }); // first write wins
    expect(writes[0]?.ttlSeconds).toBe(DEFAULT_TTL_SECONDS);
    expect(writes[0]?.onlyIfAbsent).toBe(true);
  });

  it("indexes active sessions and pages them by score", async () => {
    const { redis } = createMemoryStateRedis();

    await touchActive("late", 300, redis);
    await touchActive("early", 100, redis);
    await touchActive("mid", 200, redis);

    expect(await listActiveSessionIds(1000, {}, redis)).toEqual([
      "early",
      "mid",
      "late",
    ]);
    expect(
      await listActiveSessionIds(1000, { offset: 0, count: 2 }, redis),
    ).toEqual(["early", "mid"]);
    expect(await countActiveSessions(1000, redis)).toBe(3);
  });

  it("re-touching a session updates its score, not its count", async () => {
    const { redis } = createMemoryStateRedis();

    await touchActive("sid", 100, redis);
    await touchActive("sid", 500, redis);

    expect(await countActiveSessions(1000, redis)).toBe(1);
    expect(await listActiveSessionIds(400, {}, redis)).toEqual([]); // now scored 500
    expect(await listActiveSessionIds(1000, {}, redis)).toEqual(["sid"]);
  });

  it("trims sessions older than the retention window", async () => {
    const { redis } = createMemoryStateRedis();

    await touchActive("old", 100, redis);
    await touchActive("fresh", 900, redis);

    await trimActiveIndex(500, redis);

    expect(await listActiveSessionIds(1000, {}, redis)).toEqual(["fresh"]);
  });

  it("reads every domain key for a session, with nulls for misses", async () => {
    const { redis } = createMemoryStateRedis();
    await putState(
      redisKey.session("sid"),
      { updatedAt: 1, data: {} },
      {},
      redis,
    );
    await putState(
      redisKey.history("sid"),
      { updatedAt: 2, data: [] },
      {},
      redis,
    );

    const snapshot = await readSessionState("sid", redis);

    expect(snapshot.session).toEqual({ updatedAt: 1, data: {} });
    expect(snapshot.history).toEqual({ updatedAt: 2, data: [] });
    expect(snapshot.feedbackLatest).toBeNull();
    expect(snapshot.lesson).toBeNull();
    expect(snapshot.meta).toBeNull();
  });
});
