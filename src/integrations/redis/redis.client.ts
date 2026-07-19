import "server-only";

import { Redis } from "@upstash/redis";
import type { ZodType } from "zod";

import { readServerEnvironment } from "@/config/environment";

/**
 * Durable learner-state store. Redis is the source of truth behind the
 * `/api/state` seam; the browser keeps a synchronous localStorage mirror.
 *
 * All learner keys are namespaced by anonymous session id: `gp:{sid}:{domain}`.
 * `gp:index:active` is a sorted set (score = last-write epoch-ms) so the daily
 * EOD job can page the sessions that changed and snapshot them into MongoDB.
 */

export class RedisStateError extends Error {
  constructor(
    public readonly operation: string,
    options?: { cause?: unknown },
  ) {
    super(`The learner-data store failed during ${operation}.`, options);
    this.name = "RedisStateError";
  }
}

export const SESSION_INDEX_KEY = "gp:index:active";

export const redisKey = {
  session: (sid: string) => `gp:${sid}:session`,
  feedbackLatest: (sid: string) => `gp:${sid}:feedback:latest`,
  feedbackCache: (sid: string) => `gp:${sid}:feedback:cache`,
  history: (sid: string) => `gp:${sid}:history`,
  lesson: (sid: string) => `gp:${sid}:lesson`,
  meta: (sid: string) => `gp:${sid}:meta`,
} as const;

/** 30-day sliding TTL, refreshed on every write so idle sessions expire. */
export const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;
/** The lesson handoff is short-lived (assessment → lesson navigation). */
export const LESSON_TTL_SECONDS = 60 * 60 * 24;

/**
 * Narrow, JSON-aware surface the state helpers depend on. Mirrors the repo's
 * `Pick<Storage, ...>` DI pattern so tests inject a Map-backed fake instead of
 * mocking the whole SDK.
 */
export interface StateRedis {
  readJson<T>(key: string): Promise<T | null>;
  writeJson(
    key: string,
    value: unknown,
    options?: { ttlSeconds?: number; onlyIfAbsent?: boolean },
  ): Promise<void>;
  readManyJson<T>(keys: string[]): Promise<(T | null)[]>;
  addToIndex(key: string, score: number, member: string): Promise<void>;
  rangeByScore(
    key: string,
    min: number,
    max: number,
    options?: { offset?: number; count?: number },
  ): Promise<string[]>;
  countByScore(key: string, min: number, max: number): Promise<number>;
  removeRangeByScore(key: string, min: number, max: number): Promise<void>;
  removeMembers(key: string, members: string[]): Promise<void>;
  deleteKeys(keys: string[]): Promise<void>;
}

function toStateRedis(redis: Redis): StateRedis {
  return {
    readJson<T>(key: string) {
      return redis.get<T>(key);
    },
    async writeJson(key, value, options) {
      const ttl = options?.ttlSeconds;
      if (options?.onlyIfAbsent) {
        await (ttl !== undefined
          ? redis.set(key, value, { nx: true, ex: ttl })
          : redis.set(key, value, { nx: true }));
        return;
      }
      await (ttl !== undefined
        ? redis.set(key, value, { ex: ttl })
        : redis.set(key, value));
    },
    async readManyJson<T>(keys: string[]) {
      if (keys.length === 0) {
        return [];
      }
      return redis.mget<(T | null)[]>(...keys);
    },
    async addToIndex(key, score, member) {
      await redis.zadd(key, { score, member });
    },
    rangeByScore(key, min, max, options) {
      if (options?.offset !== undefined && options?.count !== undefined) {
        return redis.zrange<string[]>(key, min, max, {
          byScore: true,
          offset: options.offset,
          count: options.count,
        });
      }
      return redis.zrange<string[]>(key, min, max, { byScore: true });
    },
    countByScore(key, min, max) {
      return redis.zcount(key, min, max);
    },
    async removeRangeByScore(key, min, max) {
      await redis.zremrangebyscore(key, min, max);
    },
    async removeMembers(key, members) {
      if (members.length > 0) {
        await redis.zrem(key, ...members);
      }
    },
    async deleteKeys(keys) {
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    },
  };
}

let cachedClient: StateRedis | undefined;

export function getRedis(): StateRedis {
  if (cachedClient) {
    return cachedClient;
  }

  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } =
    readServerEnvironment();

  if (!url || !token) {
    throw new Error("Redis is not configured.");
  }

  cachedClient = toStateRedis(new Redis({ url, token }));
  return cachedClient;
}

/** Whether the durable store is wired up. Preview/staging can intentionally omit
 * Redis; the app then runs entirely on the localStorage mirror. */
export function isStateStoreConfigured(): boolean {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } =
    readServerEnvironment();
  return Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);
}

/** Read a session-scoped value and validate it; returns null on miss or on
 * schema drift (a corrupt/legacy value can never poison in-memory state). */
export async function getState<T>(
  key: string,
  schema: ZodType<T>,
  redis: StateRedis = getRedis(),
): Promise<T | null> {
  const raw = await redis.readJson<unknown>(key);

  if (raw === null || raw === undefined) {
    return null;
  }

  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function putState<T>(
  key: string,
  value: T,
  options: { ttlSeconds?: number; onlyIfAbsent?: boolean } = {},
  redis: StateRedis = getRedis(),
): Promise<void> {
  await redis.writeJson(key, value, {
    ttlSeconds: options.ttlSeconds ?? DEFAULT_TTL_SECONDS,
    onlyIfAbsent: options.onlyIfAbsent,
  });
}

/** Record that `sessionId` changed at `timestamp` so the EOD job flushes it. */
export async function touchActive(
  sessionId: string,
  timestamp: number,
  redis: StateRedis = getRedis(),
): Promise<void> {
  await redis.addToIndex(SESSION_INDEX_KEY, timestamp, sessionId);
}

export async function listActiveSessionIds(
  maxScore: number,
  options: { offset?: number; count?: number } = {},
  redis: StateRedis = getRedis(),
): Promise<string[]> {
  return redis.rangeByScore(SESSION_INDEX_KEY, 0, maxScore, options);
}

export async function countActiveSessions(
  maxScore: number,
  redis: StateRedis = getRedis(),
): Promise<number> {
  return redis.countByScore(SESSION_INDEX_KEY, 0, maxScore);
}

/** Drop sessions whose last write predates the retention window from the index. */
export async function trimActiveIndex(
  beforeScore: number,
  redis: StateRedis = getRedis(),
): Promise<void> {
  await redis.removeRangeByScore(SESSION_INDEX_KEY, 0, beforeScore);
}

/** Remove sessions from the active index once they've been snapshotted, so the
 * index tracks "changed since last flush" and deferred sessions never starve. */
export async function removeActiveSessions(
  sessionIds: string[],
  redis: StateRedis = getRedis(),
): Promise<void> {
  if (sessionIds.length === 0) {
    return;
  }
  await redis.removeMembers(SESSION_INDEX_KEY, sessionIds);
}

/** Right-to-erasure: delete every key for a session and drop it from the index. */
export async function deleteSessionState(
  sessionId: string,
  redis: StateRedis = getRedis(),
): Promise<void> {
  await redis.deleteKeys([
    redisKey.session(sessionId),
    redisKey.feedbackLatest(sessionId),
    redisKey.feedbackCache(sessionId),
    redisKey.history(sessionId),
    redisKey.lesson(sessionId),
    redisKey.meta(sessionId),
  ]);
  await removeActiveSessions([sessionId], redis);
}

export type SessionStateSnapshot = {
  session: unknown;
  feedbackLatest: unknown;
  feedbackCache: unknown;
  history: unknown;
  lesson: unknown;
  meta: unknown;
};

/** Read every domain key for a session in one round-trip, for EOD archival.
 * Values are returned raw (already stored validated) so archival never drops
 * data on a schema mismatch. */
export async function readSessionState(
  sessionId: string,
  redis: StateRedis = getRedis(),
): Promise<SessionStateSnapshot> {
  const [session, feedbackLatest, feedbackCache, history, lesson, meta] =
    await redis.readManyJson<unknown>([
      redisKey.session(sessionId),
      redisKey.feedbackLatest(sessionId),
      redisKey.feedbackCache(sessionId),
      redisKey.history(sessionId),
      redisKey.lesson(sessionId),
      redisKey.meta(sessionId),
    ]);

  return { session, feedbackLatest, feedbackCache, history, lesson, meta };
}
