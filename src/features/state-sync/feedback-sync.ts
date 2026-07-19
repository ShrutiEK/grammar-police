import {
  readFeedbackCache,
  readLatestFeedback,
  savePictureConversationFeedback,
  writeFeedbackCache,
  writeLatestFeedback,
} from "@/features/assessment/picture-conversation-storage";
import {
  feedbackCacheSchema,
  pictureConversationFeedbackSchema,
  type PictureConversationFeedback,
  type PictureConversationInput,
} from "@/features/assessment/picture-conversation.schema";

import { getEnvelope, putEnvelope, STATE_ENDPOINTS } from "./sync-transport";

/**
 * Feedback write-through: save locally (unchanged domain logic) and mirror both
 * the latest feedback and the whole conversation-keyed cache to Redis.
 */
export function syncedSavePictureConversationFeedback(
  input: PictureConversationInput,
  feedback: PictureConversationFeedback,
): void {
  const cache = savePictureConversationFeedback(input, feedback);
  const updatedAt = Date.now();
  void putEnvelope(STATE_ENDPOINTS.feedback, { updatedAt, data: feedback });
  void putEnvelope(STATE_ENDPOINTS.feedbackCache, { updatedAt, data: cache });
}

/** Restore feedback from Redis onto a device that has none yet. A device that
 * already holds local feedback keeps it (this device's session is authoritative). */
export async function hydrateFeedbackFromRemote(): Promise<void> {
  if (readLatestFeedback()) {
    return;
  }

  const [remoteLatest, remoteCache] = await Promise.all([
    getEnvelope(STATE_ENDPOINTS.feedback, pictureConversationFeedbackSchema),
    getEnvelope(STATE_ENDPOINTS.feedbackCache, feedbackCacheSchema),
  ]);

  if (remoteLatest) {
    writeLatestFeedback(remoteLatest.data);
  }
  if (remoteCache && Object.keys(remoteCache.data).length > 0) {
    // Local wins on key conflicts; here local is empty so remote populates it.
    writeFeedbackCache({ ...remoteCache.data, ...readFeedbackCache() });
  }
}
