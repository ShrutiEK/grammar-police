import {
  archivePictureAssessment,
  mergePictureAssessmentAttempts,
  savePictureAssessmentHistory,
  type PictureAssessmentAttempt,
} from "@/features/assessment/picture-assessment-history";
import { pictureAssessmentHistorySchema } from "@/features/assessment/picture-conversation.schema";

import { getEnvelope, putEnvelope, STATE_ENDPOINTS } from "./sync-transport";

/** Archive an attempt locally (merge + cap) and mirror the result to Redis. */
export function syncedArchivePictureAssessment(
  attempt: PictureAssessmentAttempt,
): PictureAssessmentAttempt[] {
  const nextHistory = archivePictureAssessment(attempt);
  void putEnvelope(STATE_ENDPOINTS.history, {
    updatedAt: Date.now(),
    data: nextHistory,
  });
  return nextHistory;
}

/**
 * Union-merge the Redis history into the local mirror (dedupe by turn-prefix, cap
 * to 20) so two devices don't clobber each other, then push the converged list
 * back. Returns the merged history for the caller to render.
 */
export async function reconcilePictureAssessmentHistory(
  localHistory: ReadonlyArray<PictureAssessmentAttempt>,
): Promise<PictureAssessmentAttempt[]> {
  const remote = await getEnvelope(
    STATE_ENDPOINTS.history,
    pictureAssessmentHistorySchema,
  );

  if (!remote) {
    return [...localHistory];
  }

  const merged = savePictureAssessmentHistory(
    mergePictureAssessmentAttempts([...remote.data, ...localHistory]),
  );
  // Only push back when the merge actually added something the server lacks —
  // avoids a redundant write on every page load where nothing changed.
  if (JSON.stringify(merged) !== JSON.stringify(remote.data)) {
    void putEnvelope(STATE_ENDPOINTS.history, {
      updatedAt: Date.now(),
      data: merged,
    });
  }
  return merged;
}
