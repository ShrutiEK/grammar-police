import "server-only";

import type { SnapshotStore } from "@/integrations/mongo/mongo.client";
import {
  DEFAULT_TTL_SECONDS,
  countActiveSessions,
  listActiveSessionIds,
  readSessionState,
  removeActiveSessions,
  trimActiveIndex,
  type StateRedis,
} from "@/integrations/redis/redis.client";

/**
 * End-of-day flush: snapshot every session that changed since the last run into
 * MongoDB, then remove it from the active index. Bounded by `batchSize` so it
 * finishes inside the Vercel function budget; overflow is deferred (safely — the
 * sessions stay in the index and Redis keys keep their TTL) to the next daily run.
 */

export const EOD_BATCH_SIZE = 200;
const RETENTION_MS = DEFAULT_TTL_SECONDS * 1000;

function toUtcDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

export async function runEodFlush(options: {
  redis: StateRedis;
  snapshots: SnapshotStore;
  now: number;
  batchSize?: number;
  retentionMs?: number;
}): Promise<{ flushed: number; deferred: number }> {
  const { redis, snapshots, now } = options;
  const batchSize = options.batchSize ?? EOD_BATCH_SIZE;
  const retentionMs = options.retentionMs ?? RETENTION_MS;

  await snapshots.ensureIndexes();

  const total = await countActiveSessions(now, redis);
  const sessionIds = await listActiveSessionIds(
    now,
    { offset: 0, count: batchSize },
    redis,
  );
  const date = toUtcDate(now);
  const snapshotAt = new Date(now);

  const flushed: string[] = [];
  for (const sessionId of sessionIds) {
    try {
      const state = await readSessionState(sessionId, redis);
      await snapshots.upsertSnapshot({
        sessionId,
        date,
        meta: state.meta,
        session: state.session,
        feedbackLatest: state.feedbackLatest,
        feedbackCache: state.feedbackCache,
        history: state.history,
        lesson: state.lesson,
        snapshotAt,
      });
      flushed.push(sessionId);
    } catch (error) {
      // One bad session must not abort the batch; it retries next run.
      console.error(`EOD flush failed for session ${sessionId}`, error);
    }
  }

  // Index = "changed since last flush": drop what we snapshotted, and evict any
  // repeatedly-failing sessions once they're past the retention window.
  await removeActiveSessions(flushed, redis);
  await trimActiveIndex(now - retentionMs, redis);

  return {
    flushed: flushed.length,
    deferred: Math.max(0, total - sessionIds.length),
  };
}
