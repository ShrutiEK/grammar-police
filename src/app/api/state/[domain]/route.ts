import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type z } from "zod";

import { assessmentSessionSchema } from "@/features/assessment/assessment-session.schema";
import {
  feedbackCacheSchema,
  pictureAssessmentHistorySchema,
  pictureConversationFeedbackSchema,
} from "@/features/assessment/picture-conversation.schema";
import { pictureConversationAssessmentSchema } from "@/features/lesson/learning-assessment.schema";
import {
  envelopeSchema,
  type SyncEnvelope,
} from "@/features/state-sync/envelope";
import { SESSION_COOKIE_NAME } from "@/features/state-sync/session";
import {
  DEFAULT_TTL_SECONDS,
  LESSON_TTL_SECONDS,
  deleteSessionState,
  getRedis,
  getState,
  isStateStoreConfigured,
  putState,
  redisKey,
  touchActive,
  type StateRedis,
} from "@/integrations/redis/redis.client";

// Upstash is HTTP-based, so these tiny reads/writes run on the Edge runtime.
// The Mongo driver must never reach here — it lives only in the Node cron route.
export const runtime = "edge";

type DomainHandler = {
  parse: (body: unknown) => SyncEnvelope<unknown>;
  read: (
    sid: string,
    redis: StateRedis,
  ) => Promise<SyncEnvelope<unknown> | null>;
  persist: (
    sid: string,
    envelope: SyncEnvelope<unknown>,
    redis: StateRedis,
  ) => Promise<void>;
};

function createDomainHandler<T>(
  key: (sid: string) => string,
  dataSchema: z.ZodType<T>,
  ttlSeconds: number,
): DomainHandler {
  const schema = envelopeSchema(dataSchema);
  return {
    parse: (body) => schema.parse(body),
    read: (sid, redis) => getState(key(sid), schema, redis),
    persist: async (sid, envelope, redis) => {
      // Last-write-wins: never let a stale or out-of-order write (a slow
      // in-flight PUT landing after a newer one, or a second tab) clobber the
      // newest value. This keeps Redis — and therefore the EOD Mongo snapshot —
      // converged on the latest data regardless of arrival order.
      const stored = await getState(key(sid), schema, redis);
      if (stored && stored.updatedAt >= envelope.updatedAt) {
        return;
      }
      await putState(key(sid), envelope, { ttlSeconds }, redis);
      await touchActive(sid, envelope.updatedAt, redis);
    },
  };
}

// Each domain binds its OWN schema. feedback/history use the strict 8-metric
// assessment; lesson uses the loose variant — they are never unified.
const domainHandlers: Record<string, DomainHandler> = {
  session: createDomainHandler(
    redisKey.session,
    assessmentSessionSchema,
    DEFAULT_TTL_SECONDS,
  ),
  feedback: createDomainHandler(
    redisKey.feedbackLatest,
    pictureConversationFeedbackSchema,
    DEFAULT_TTL_SECONDS,
  ),
  "feedback-cache": createDomainHandler(
    redisKey.feedbackCache,
    feedbackCacheSchema,
    DEFAULT_TTL_SECONDS,
  ),
  history: createDomainHandler(
    redisKey.history,
    pictureAssessmentHistorySchema,
    DEFAULT_TTL_SECONDS,
  ),
  lesson: createDomainHandler(
    redisKey.lesson,
    pictureConversationAssessmentSchema,
    LESSON_TTL_SECONDS,
  ),
};

type RouteContext = { params: Promise<{ domain: string }> };

function resolveSessionId(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Capture IP / geo / user-agent once per session (first write wins). Best
 * effort — a metadata failure must never fail the learner's state write. */
async function captureSessionMeta(
  request: NextRequest,
  sid: string,
  timestamp: number,
  redis: StateRedis,
): Promise<void> {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const city = request.headers.get("x-vercel-ip-city");

  const meta = {
    ip:
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    country: request.headers.get("x-vercel-ip-country"),
    region: request.headers.get("x-vercel-ip-country-region"),
    city: city ? decodeURIComponent(city) : null,
    userAgent: request.headers.get("user-agent"),
    createdAt: timestamp,
  };

  try {
    await putState(redisKey.meta(sid), meta, { onlyIfAbsent: true }, redis);
  } catch (error) {
    console.error("Session metadata capture failed", error);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { domain } = await context.params;
  const handler = domainHandlers[domain];

  if (!handler) {
    return NextResponse.json(
      { error: "Unknown state domain." },
      { status: 404 },
    );
  }

  const sid = resolveSessionId(request);
  if (!sid) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  // No durable store configured (e.g. preview/staging): behave as an empty
  // store so the client falls back to its localStorage mirror — no error noise.
  if (!isStateStoreConfigured()) {
    return NextResponse.json(null);
  }

  try {
    const value = await handler.read(sid, getRedis());
    return NextResponse.json(value);
  } catch (error) {
    console.error(`State GET failed for ${domain}`, error);
    return NextResponse.json(
      { error: "The learner-data store is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { domain } = await context.params;
  const handler = domainHandlers[domain];

  if (!handler) {
    return NextResponse.json(
      { error: "Unknown state domain." },
      { status: 404 },
    );
  }

  const sid = resolveSessionId(request);
  if (!sid) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  // No durable store configured (e.g. preview/staging): accept the write as a
  // no-op so the client keeps its localStorage mirror without retry noise.
  if (!isStateStoreConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  let envelope: SyncEnvelope<unknown>;
  try {
    envelope = handler.parse(await request.json());
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid state payload." },
        { status: 400 },
      );
    }
    throw error;
  }

  try {
    const redis = getRedis();
    await handler.persist(sid, envelope, redis);
    await captureSessionMeta(request, sid, envelope.updatedAt, redis);
  } catch (error) {
    console.error(`State PUT failed for ${domain}`, error);
    return NextResponse.json(
      { error: "The learner-data store is temporarily unavailable." },
      { status: 503 },
    );
  }

  return new NextResponse(null, { status: 204 });
}

// Right-to-erasure: wipe ALL of the caller's session data (every domain), not
// just the one in the path — the domain segment is ignored here.
export async function DELETE(request: NextRequest) {
  const sid = resolveSessionId(request);
  if (!sid) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  // Nothing durable to erase when no store is configured.
  if (!isStateStoreConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await deleteSessionState(sid, getRedis());
  } catch (error) {
    console.error("State DELETE failed", error);
    return NextResponse.json(
      { error: "The learner-data store is temporarily unavailable." },
      { status: 503 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
