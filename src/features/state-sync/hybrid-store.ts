import type { z } from "zod";

import type { SyncEnvelope } from "./envelope";
import { getEnvelope, putEnvelope, type FetchLike } from "./sync-transport";

/**
 * A single-value hybrid store: localStorage is a synchronous mirror, Redis (via
 * `/api/state/*`) is the durable source of truth. The raw payload is stored
 * under the EXISTING key byte-for-byte (so the old read path and its tests are
 * untouched); a `__sync` sidecar holds `{ updatedAt, dirty }` for last-write-wins
 * reconciliation and offline retry. Reconciliation itself is the caller's job —
 * this exposes the primitives (`readLocal`, `pull`, `acceptRemote`, `flushDirty`).
 */

type MinimalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type SyncMeta = { updatedAt: number; dirty: boolean };

export type HybridStore<T> = {
  /** Synchronous local read (instant, no network); null on miss/corruption. */
  readLocal(): SyncEnvelope<T> | null;
  /** Synchronous local write + schedule a debounced push to Redis. */
  writeLocal(data: T): SyncEnvelope<T>;
  /** Adopt a remote value as authoritative locally (no push back). */
  acceptRemote(remote: SyncEnvelope<T>): void;
  /** Fetch the remote value (null on miss/failure). */
  pull(): Promise<SyncEnvelope<T> | null>;
  /** Push the local value if it has unpushed changes. */
  flushDirty(): Promise<void>;
  /** Register a `window` `online` listener that flushes; returns a cleanup. */
  registerOnlineFlush(): () => void;
};

export function createHybridStore<T>(options: {
  localKey: string;
  schema: z.ZodType<T>;
  endpoint: string;
  debounceMs?: number;
  storage?: MinimalStorage;
  fetchImpl?: FetchLike;
  now?: () => number;
}): HybridStore<T> {
  const { localKey, schema, endpoint, debounceMs = 800 } = options;
  const sidecarKey = `${localKey}__sync`;
  const now = options.now ?? (() => Date.now());
  const resolveFetch = () => options.fetchImpl ?? fetch;

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function getStorage(): MinimalStorage | null {
    if (options.storage) {
      return options.storage;
    }
    return typeof localStorage !== "undefined" ? localStorage : null;
  }

  function readMeta(storage: MinimalStorage): SyncMeta | null {
    const raw = storage.getItem(sidecarKey);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as { updatedAt?: unknown }).updatedAt === "number"
      ) {
        const meta = parsed as SyncMeta;
        return { updatedAt: meta.updatedAt, dirty: Boolean(meta.dirty) };
      }
    } catch {
      // fall through
    }
    return null;
  }

  function persistLocal(storage: MinimalStorage, data: T, meta: SyncMeta) {
    storage.setItem(localKey, JSON.stringify(data));
    storage.setItem(sidecarKey, JSON.stringify(meta));
  }

  function readData(storage: MinimalStorage): T | null {
    const raw = storage.getItem(localKey);
    if (!raw) {
      return null;
    }
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        return parsed.data;
      }
    } catch {
      // fall through to cleanup
    }
    storage.removeItem(localKey);
    storage.removeItem(sidecarKey);
    return null;
  }

  function scheduleFlush() {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      void flushDirty();
    }, debounceMs);
  }

  function readLocal(): SyncEnvelope<T> | null {
    const storage = getStorage();
    if (!storage) {
      return null;
    }
    const data = readData(storage);
    if (data === null) {
      return null;
    }
    const meta = readMeta(storage);
    // Legacy data written before the sidecar existed is treated as oldest.
    return { updatedAt: meta?.updatedAt ?? 0, data };
  }

  function writeLocal(data: T): SyncEnvelope<T> {
    const updatedAt = now();
    const storage = getStorage();
    if (storage) {
      persistLocal(storage, data, { updatedAt, dirty: true });
      scheduleFlush();
    }
    return { updatedAt, data };
  }

  function acceptRemote(remote: SyncEnvelope<T>): void {
    const storage = getStorage();
    if (storage) {
      persistLocal(storage, remote.data, {
        updatedAt: remote.updatedAt,
        dirty: false,
      });
    }
  }

  function pull(): Promise<SyncEnvelope<T> | null> {
    return getEnvelope(endpoint, schema, resolveFetch());
  }

  async function flushDirty(): Promise<void> {
    const storage = getStorage();
    if (!storage) {
      return;
    }
    const meta = readMeta(storage);
    if (!meta?.dirty) {
      return;
    }
    const data = readData(storage);
    if (data === null) {
      return;
    }

    const pushed = await putEnvelope(
      endpoint,
      { updatedAt: meta.updatedAt, data },
      resolveFetch(),
    );

    if (!pushed) {
      return; // leave dirty; retried on next write or `online`
    }
    // Only clear dirty if no newer local write happened while pushing.
    const current = readMeta(storage);
    if (current && current.updatedAt === meta.updatedAt) {
      storage.setItem(
        sidecarKey,
        JSON.stringify({ updatedAt: meta.updatedAt, dirty: false }),
      );
    }
  }

  function registerOnlineFlush(): () => void {
    if (typeof window === "undefined") {
      return () => {};
    }
    const flush = () => {
      void flushDirty();
    };
    // Flush when connectivity returns, and when the tab is backgrounded (on
    // mobile the app is often hidden/killed before `online` ever fires).
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }

  return {
    readLocal,
    writeLocal,
    acceptRemote,
    pull,
    flushDirty,
    registerOnlineFlush,
  };
}
