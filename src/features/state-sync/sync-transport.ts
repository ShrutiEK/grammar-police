import type { z } from "zod";

import { envelopeSchema, type SyncEnvelope } from "./envelope";

/**
 * The browser ↔ Redis fetch layer. Every learner-state domain speaks the same
 * `{ updatedAt, data }` envelope over `/api/state/*`. All calls are best-effort:
 * on any network/HTTP failure they resolve to `null`/`false` so the localStorage
 * mirror keeps the app working offline.
 */

export type FetchLike = typeof fetch;

export const STATE_ENDPOINTS = {
  session: "/api/state/session",
  feedback: "/api/state/feedback",
  feedbackCache: "/api/state/feedback-cache",
  history: "/api/state/history",
  lesson: "/api/state/lesson",
} as const;

export async function getEnvelope<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  fetchImpl: FetchLike = fetch,
): Promise<SyncEnvelope<T> | null> {
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "GET",
      credentials: "same-origin",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return null;
  }

  if (body === null || body === undefined) {
    return null;
  }

  const parsed = envelopeSchema(schema).safeParse(body);
  return parsed.success ? parsed.data : null;
}

export async function putEnvelope(
  endpoint: string,
  envelope: SyncEnvelope<unknown>,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(endpoint, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(envelope),
      // Survive the page-unload that follows navigation writes (lesson handoff).
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}
