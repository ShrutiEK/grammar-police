import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type {
  LearnerSnapshot,
  SnapshotStore,
} from "@/integrations/mongo/mongo.client";
import {
  SESSION_INDEX_KEY,
  redisKey,
  type StateRedis,
} from "@/integrations/redis/redis.client";

import { runEodFlush } from "./eod-flush";

const NOW = Date.UTC(2026, 6, 19, 23, 0, 0); // 2026-07-19T23:00:00Z

function createMemoryStateRedis() {
  const values = new Map<string, unknown>();
  const zsets = new Map<string, Map<string, number>>();
  const zsetFor = (key: string) => {
    const existing = zsets.get(key);
    if (existing) return existing;
    const created = new Map<string, number>();
    zsets.set(key, created);
    return created;
  };
  const redis: StateRedis = {
    async readJson(key) {
      return (values.has(key) ? values.get(key) : null) as never;
    },
    async writeJson(key, value) {
      values.set(key, value);
    },
    async readManyJson(keys) {
      return keys.map((key) =>
        values.has(key) ? values.get(key) : null,
      ) as never;
    },
    async addToIndex(key, score, member) {
      zsetFor(key).set(member, score);
    },
    async rangeByScore(key, min, max, options) {
      const members = [...zsetFor(key).entries()]
        .filter(([, score]) => score >= min && score <= max)
        .sort((a, b) => a[1] - b[1])
        .map(([member]) => member);
      return options?.offset !== undefined && options?.count !== undefined
        ? members.slice(options.offset, options.offset + options.count)
        : members;
    },
    async countByScore(key, min, max) {
      return [...zsetFor(key).values()].filter((s) => s >= min && s <= max)
        .length;
    },
    async removeRangeByScore(key, min, max) {
      const set = zsetFor(key);
      for (const [member, score] of [...set.entries()]) {
        if (score >= min && score <= max) set.delete(member);
      }
    },
    async removeMembers(key, members) {
      const set = zsetFor(key);
      for (const member of members) set.delete(member);
    },
    async deleteKeys(keys) {
      for (const key of keys) {
        values.delete(key);
        zsets.delete(key);
      }
    },
  };
  return { redis, values, zsets };
}

function createFakeSnapshotStore() {
  const upserts: LearnerSnapshot[] = [];
  const failFor = new Set<string>();
  let ensured = 0;
  const store: SnapshotStore = {
    async ensureIndexes() {
      ensured += 1;
    },
    async upsertSnapshot(snapshot) {
      if (failFor.has(snapshot.sessionId)) {
        throw new Error(`boom ${snapshot.sessionId}`);
      }
      upserts.push(snapshot);
    },
  };
  return { store, upserts, failFor, ensuredCount: () => ensured };
}

function indexSize(zsets: Map<string, Map<string, number>>) {
  return zsets.get(SESSION_INDEX_KEY)?.size ?? 0;
}

describe("runEodFlush", () => {
  it("snapshots active sessions and clears them from the index", async () => {
    const { redis, zsets } = createMemoryStateRedis();
    await redis.writeJson(redisKey.session("s1"), {
      updatedAt: 10,
      data: { a: 1 },
    });
    await redis.writeJson(redisKey.meta("s1"), { country: "IN" });
    await redis.addToIndex(SESSION_INDEX_KEY, NOW - 1000, "s1");
    await redis.writeJson(redisKey.history("s2"), { updatedAt: 20, data: [] });
    await redis.addToIndex(SESSION_INDEX_KEY, NOW - 2000, "s2");

    const { store, upserts, ensuredCount } = createFakeSnapshotStore();
    const result = await runEodFlush({ redis, snapshots: store, now: NOW });

    expect(ensuredCount()).toBe(1);
    expect(result).toEqual({ flushed: 2, deferred: 0 });
    expect(indexSize(zsets)).toBe(0);

    const s1 = upserts.find((u) => u.sessionId === "s1");
    expect(s1).toMatchObject({
      date: "2026-07-19",
      meta: { country: "IN" },
      session: { updatedAt: 10, data: { a: 1 } },
    });
    expect(s1?.snapshotAt.getTime()).toBe(NOW);
  });

  it("respects the batch cap and reports the deferred remainder", async () => {
    const { redis, zsets } = createMemoryStateRedis();
    for (const [index, id] of ["a", "b", "c"].entries()) {
      await redis.writeJson(redisKey.session(id), { updatedAt: 1, data: {} });
      await redis.addToIndex(SESSION_INDEX_KEY, NOW - (index + 1) * 100, id);
    }

    const { store } = createFakeSnapshotStore();
    const result = await runEodFlush({
      redis,
      snapshots: store,
      now: NOW,
      batchSize: 2,
    });

    expect(result).toEqual({ flushed: 2, deferred: 1 });
    // One session remains in the index for the next run — no starvation.
    expect(indexSize(zsets)).toBe(1);
  });

  it("keeps a failing session in the index, but evicts it once past retention", async () => {
    const { redis, zsets } = createMemoryStateRedis();
    await redis.writeJson(redisKey.session("good"), { updatedAt: 1, data: {} });
    await redis.addToIndex(SESSION_INDEX_KEY, NOW - 100, "good");
    await redis.writeJson(redisKey.session("bad"), { updatedAt: 1, data: {} });
    await redis.addToIndex(SESSION_INDEX_KEY, NOW - 5000, "bad");

    const { store, failFor } = createFakeSnapshotStore();
    failFor.add("bad");

    const result = await runEodFlush({
      redis,
      snapshots: store,
      now: NOW,
      retentionMs: 1000, // "bad" is 5s old → past retention → trimmed
    });

    expect(result.flushed).toBe(1); // only "good" succeeded
    expect(indexSize(zsets)).toBe(0); // "good" removed by flush, "bad" by trim
  });
});
