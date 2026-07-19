import { describe, expect, it, vi } from "vitest";
import type { Db } from "mongodb";

vi.mock("server-only", () => ({}));

import {
  LEARNER_SNAPSHOTS_COLLECTION,
  toSnapshotStore,
  type LearnerSnapshot,
} from "./mongo.client";

type UpdateOneCall = { filter: unknown; update: unknown; options: unknown };
type CreateIndexCall = { spec: unknown; options: unknown };

function createFakeDb() {
  const updateOneCalls: UpdateOneCall[] = [];
  const createIndexCalls: CreateIndexCall[] = [];
  const requestedCollections: string[] = [];

  const collection = {
    async updateOne(filter: unknown, update: unknown, options: unknown) {
      updateOneCalls.push({ filter, update, options });
      return { acknowledged: true, upsertedId: null };
    },
    async createIndex(spec: unknown, options: unknown) {
      createIndexCalls.push({ spec, options });
      return "sessionId_1_date_1";
    },
  };

  const db = {
    collection(name: string) {
      requestedCollections.push(name);
      return collection;
    },
  } as unknown as Db;

  return { db, updateOneCalls, createIndexCalls, requestedCollections };
}

const snapshot: LearnerSnapshot = {
  sessionId: "sid-1",
  date: "2026-07-19",
  meta: { country: "IN" },
  session: { updatedAt: 1, data: {} },
  feedbackLatest: null,
  feedbackCache: null,
  history: { updatedAt: 2, data: [] },
  lesson: null,
  snapshotAt: new Date("2026-07-19T23:00:00.000Z"),
};

describe("mongo snapshot store", () => {
  it("targets the learner_snapshots collection", () => {
    const { db, requestedCollections } = createFakeDb();

    toSnapshotStore(db);

    expect(requestedCollections).toEqual([LEARNER_SNAPSHOTS_COLLECTION]);
  });

  it("creates a unique index on sessionId + date", async () => {
    const { db, createIndexCalls } = createFakeDb();

    await toSnapshotStore(db).ensureIndexes();

    expect(createIndexCalls).toEqual([
      { spec: { sessionId: 1, date: 1 }, options: { unique: true } },
    ]);
  });

  it("upserts by { sessionId, date } so a re-run overwrites rather than duplicates", async () => {
    const { db, updateOneCalls } = createFakeDb();
    const store = toSnapshotStore(db);

    await store.upsertSnapshot(snapshot);
    await store.upsertSnapshot(snapshot);

    expect(updateOneCalls).toHaveLength(2);
    for (const call of updateOneCalls) {
      expect(call.filter).toEqual({ sessionId: "sid-1", date: "2026-07-19" });
      expect(call.update).toEqual({ $set: snapshot });
      expect(call.options).toEqual({ upsert: true });
    }
  });
});
