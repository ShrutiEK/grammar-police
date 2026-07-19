import {
  pictureConversationAssessmentSchema,
  type PictureConversationAssessment,
} from "@/features/lesson/learning-assessment.schema";
import { saveLessonAssessment } from "@/features/lesson/lesson-assessment-storage";

import { getEnvelope, putEnvelope, STATE_ENDPOINTS } from "./sync-transport";

/**
 * Persist the assessment → lesson handoff to sessionStorage (unchanged) and
 * mirror it to Redis so the lesson survives a page navigation on a flaky
 * connection or a switch to a fresh tab.
 */
export function syncedSaveLessonAssessment(assessment: unknown): void {
  saveLessonAssessment(assessment); // validates + writes sessionStorage (throws if invalid)
  const parsed = pictureConversationAssessmentSchema.parse(assessment);
  void putEnvelope(STATE_ENDPOINTS.lesson, {
    updatedAt: Date.now(),
    data: parsed,
  });
}

/** Fetch the lesson handoff from Redis (fallback when sessionStorage is empty). */
export async function pullLessonAssessment(): Promise<PictureConversationAssessment | null> {
  const remote = await getEnvelope(
    STATE_ENDPOINTS.lesson,
    pictureConversationAssessmentSchema,
  );
  return remote?.data ?? null;
}
