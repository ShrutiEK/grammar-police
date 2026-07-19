import "server-only";

import { MongoClient, type Collection, type Db } from "mongodb";

import { readServerEnvironment } from "@/config/environment";

/**
 * End-of-day snapshot store. The daily cron reads each active session's Redis
 * state and upserts one document per `{ sessionId, date }` here for durable,
 * long-term storage. Node runtime only — the driver opens TCP sockets and must
 * never be imported into an Edge route.
 */

export class MongoStateError extends Error {
  constructor(
    public readonly operation: string,
    options?: { cause?: unknown },
  ) {
    super(`The snapshot store failed during ${operation}.`, options);
    this.name = "MongoStateError";
  }
}

export const LEARNER_SNAPSHOTS_COLLECTION = "learner_snapshots";

export type LearnerSnapshot = {
  sessionId: string;
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string;
  meta: unknown;
  session: unknown;
  feedbackLatest: unknown;
  feedbackCache: unknown;
  history: unknown;
  lesson: unknown;
  snapshotAt: Date;
};

// Cache the connection promise on `globalThis` so it survives HMR in dev and
// warm serverless invocations in production — no reconnect per request.
const globalForMongo = globalThis as typeof globalThis & {
  __grammarPoliceMongo?: Promise<MongoClient>;
};

export async function getMongoDb(): Promise<Db> {
  const { MONGODB_URI, MONGODB_DB } = readServerEnvironment();

  if (!MONGODB_URI || !MONGODB_DB) {
    throw new Error("MongoDB is not configured.");
  }

  globalForMongo.__grammarPoliceMongo ??= new MongoClient(MONGODB_URI, {
    maxPoolSize: 5,
  }).connect();

  const client = await globalForMongo.__grammarPoliceMongo;
  return client.db(MONGODB_DB);
}

/**
 * Narrow write surface the EOD flush depends on, so the flush can be unit-tested
 * with a fake instead of a live Mongo connection.
 */
export interface SnapshotStore {
  ensureIndexes(): Promise<void>;
  upsertSnapshot(snapshot: LearnerSnapshot): Promise<void>;
}

export function toSnapshotStore(db: Db): SnapshotStore {
  const collection: Collection<LearnerSnapshot> =
    db.collection<LearnerSnapshot>(LEARNER_SNAPSHOTS_COLLECTION);

  return {
    async ensureIndexes() {
      await collection.createIndex({ sessionId: 1, date: 1 }, { unique: true });
    },
    async upsertSnapshot(snapshot) {
      // Idempotent: re-running the same day overwrites rather than duplicates.
      await collection.updateOne(
        { sessionId: snapshot.sessionId, date: snapshot.date },
        { $set: snapshot },
        { upsert: true },
      );
    },
  };
}
