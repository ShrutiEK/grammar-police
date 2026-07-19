import { runEodFlush } from "@/features/state-sync/eod-flush";
import { readServerEnvironment } from "@/config/environment";
import { getMongoDb, toSnapshotStore } from "@/integrations/mongo/mongo.client";
import { getRedis } from "@/integrations/redis/redis.client";

// The Mongo driver opens TCP sockets, so this must run on the Node runtime.
export const runtime = "nodejs";
// Bound the run to the Vercel Hobby ceiling; the flush pages within it.
export const maxDuration = 60;

export async function GET(request: Request) {
  // Vercel Cron attaches `Authorization: Bearer $CRON_SECRET` automatically.
  const cronSecret = readServerEnvironment().CRON_SECRET;
  const authorized =
    !!cronSecret &&
    request.headers.get("authorization") === `Bearer ${cronSecret}`;

  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const result = await runEodFlush({
      redis: getRedis(),
      snapshots: toSnapshotStore(db),
      now: Date.now(),
    });

    if (result.deferred > 0) {
      console.warn(
        `EOD flush deferred ${result.deferred} session(s) to the next run.`,
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("EOD flush failed", error);
    return Response.json({ error: "EOD flush failed." }, { status: 500 });
  }
}
