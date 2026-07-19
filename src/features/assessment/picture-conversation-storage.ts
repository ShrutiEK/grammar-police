import {
  feedbackCacheSchema,
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

/** The cache was unbounded; cap it so a single Redis value / request stays small. */
export const FEEDBACK_CACHE_LIMIT = 50;

export function capFeedbackCache(
  cache: Record<string, PictureConversationFeedback>,
  limit = FEEDBACK_CACHE_LIMIT,
): Record<string, PictureConversationFeedback> {
  const entries = Object.entries(cache);
  if (entries.length <= limit) {
    return cache;
  }
  // String keys preserve insertion order, so this keeps the most recent entries.
  return Object.fromEntries(entries.slice(entries.length - limit));
}

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
): Record<string, PictureConversationFeedback> {
  const cacheKey = getConversationCacheKey(input);
  const feedbackCache = getFeedbackCache(localStorage);

  feedbackCache[cacheKey] = feedback;
  const cappedCache = capFeedbackCache(feedbackCache);
  localStorage.setItem(
    pictureConversationFeedbackCacheStorageKey,
    JSON.stringify(cappedCache),
  );
  saveLatestPictureConversationFeedback(feedback);
  localStorage.setItem(latestFeedbackIsBoundStorageKey, "true");
  // Returned so the sync layer can push the updated cache to Redis.
  return cappedCache;
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

// Helpers used by the Redis sync layer to hydrate a device that has no local
// feedback yet (e.g. a returning learner on a new browser).

export function readLatestFeedback(storage: Storage = localStorage) {
  return getStoredFeedback(storage);
}

export function readFeedbackCache(storage: Storage = localStorage) {
  return getFeedbackCache(storage);
}

export function writeLatestFeedback(
  feedback: PictureConversationFeedback,
  storage: Storage = localStorage,
) {
  storage.setItem(
    pictureConversationFeedbackStorageKey,
    JSON.stringify(feedback),
  );
  storage.setItem(latestFeedbackIsBoundStorageKey, "true");
}

export function writeFeedbackCache(
  cache: Record<string, PictureConversationFeedback>,
  storage: Storage = localStorage,
) {
  storage.setItem(
    pictureConversationFeedbackCacheStorageKey,
    JSON.stringify(capFeedbackCache(cache)),
  );
}
