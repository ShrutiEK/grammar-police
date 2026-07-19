import {
  pictureConversationFeedbackSchema,
  pictureConversationInputSchema,
  type PictureConversationFeedback,
  type PictureConversationInput,
} from "./picture-conversation.schema";

export const pictureConversationFeedbackStorageKey =
  "grammar_police_picture_conversation_feedback";
const pictureConversationFeedbackCacheStorageKey =
  "grammar_police_picture_conversation_feedback_cache";
const latestFeedbackIsBoundStorageKey =
  "grammar_police_picture_conversation_feedback_is_bound";

const feedbackCacheSchema = z.record(
  z.string(),
  pictureConversationFeedbackSchema,
);

function getStoredFeedback(storage: Storage) {
  const storedFeedback = storage.getItem(pictureConversationFeedbackStorageKey);

  if (!storedFeedback) {
    return null;
  }

  try {
    const parsedFeedback = pictureConversationFeedbackSchema.safeParse(
      JSON.parse(storedFeedback) as unknown,
    );

    if (parsedFeedback.success) {
      return parsedFeedback.data;
    }
  } catch {
    // The invalid browser data is removed below.
  }

  storage.removeItem(pictureConversationFeedbackStorageKey);
  return null;
}

function getFeedbackCache(storage: Storage) {
  const storedCache = storage.getItem(
    pictureConversationFeedbackCacheStorageKey,
  );

  if (!storedCache) {
    return {} as Record<string, PictureConversationFeedback>;
  }

  try {
    const parsedCache = feedbackCacheSchema.safeParse(
      JSON.parse(storedCache) as unknown,
    );

    if (parsedCache.success) {
      return parsedCache.data;
    }
  } catch {
    // The invalid browser data is removed below.
  }

  storage.removeItem(pictureConversationFeedbackCacheStorageKey);
  return {} as Record<string, PictureConversationFeedback>;
}

function getConversationCacheKey(input: PictureConversationInput) {
  return JSON.stringify(pictureConversationInputSchema.parse(input));
}

function saveLatestPictureConversationFeedback(
  feedback: PictureConversationFeedback,
) {
  localStorage.setItem(
    pictureConversationFeedbackStorageKey,
    JSON.stringify(feedback),
  );
}

export function savePictureConversationFeedback(
  input: PictureConversationInput,
  feedback: PictureConversationFeedback,
) {
  const cacheKey = getConversationCacheKey(input);
  const feedbackCache = getFeedbackCache(localStorage);

  feedbackCache[cacheKey] = feedback;
  localStorage.setItem(
    pictureConversationFeedbackCacheStorageKey,
    JSON.stringify(feedbackCache),
  );
  saveLatestPictureConversationFeedback(feedback);
  localStorage.setItem(latestFeedbackIsBoundStorageKey, "true");
}

export function loadPictureConversationFeedback() {
  const localFeedback = getStoredFeedback(localStorage);

  if (localFeedback) {
    return localFeedback;
  }

  // Keep feedback created before this change, then migrate it to durable
  // storage the first time it is read.
  const sessionFeedback = getStoredFeedback(sessionStorage);

  if (sessionFeedback) {
    saveLatestPictureConversationFeedback(sessionFeedback);
    sessionStorage.removeItem(pictureConversationFeedbackStorageKey);
  }

  return sessionFeedback;
}

export function loadPictureConversationFeedbackForInput(
  input: PictureConversationInput,
) {
  const cacheKey = getConversationCacheKey(input);
  const feedbackCache = getFeedbackCache(localStorage);
  const cachedFeedback = feedbackCache[cacheKey];

  if (cachedFeedback) {
    return cachedFeedback;
  }

  if (localStorage.getItem(latestFeedbackIsBoundStorageKey) === "true") {
    return null;
  }

  // Feedback saved before conversation-keyed caching existed is unbound. The
  // learner explicitly asked to view feedback for this restored conversation,
  // so bind that one legacy result now. Every later lookup is exact-match only.
  const legacyFeedback = loadPictureConversationFeedback();

  if (!legacyFeedback) {
    return null;
  }

  savePictureConversationFeedback(input, legacyFeedback);
  return legacyFeedback;
}
import { z } from "zod";
