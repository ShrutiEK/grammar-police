import { z } from "zod";

import {
  pictureConversationFeedbackSchema,
  pictureConversationInputSchema,
  type PictureConversationFeedback,
  type PictureConversationInput,
} from "./picture-conversation.schema";

const pictureAssessmentAttemptSchema = z.object({
  feedback: pictureConversationFeedbackSchema,
  input: pictureConversationInputSchema,
});

const pictureAssessmentHistorySchema = pictureAssessmentAttemptSchema
  .array()
  .max(20);

export type PictureAssessmentAttempt = Readonly<{
  feedback: PictureConversationFeedback;
  input: PictureConversationInput;
}>;

export const pictureAssessmentHistoryStorageKey =
  "grammar_police_picture_assessment_history_v1";

function turnsArePrefix(
  shorter: PictureConversationInput,
  longer: PictureConversationInput,
) {
  return (
    shorter.pictureFilename === longer.pictureFilename &&
    shorter.turns.length <= longer.turns.length &&
    shorter.turns.every(
      (turn, index) =>
        JSON.stringify(turn) === JSON.stringify(longer.turns[index]),
    )
  );
}

export function mergePictureAssessmentAttempts(
  attempts: ReadonlyArray<PictureAssessmentAttempt>,
) {
  const merged: PictureAssessmentAttempt[] = [];

  for (const attempt of attempts) {
    const matchingIndex = merged.findIndex(
      (savedAttempt) =>
        turnsArePrefix(savedAttempt.input, attempt.input) ||
        turnsArePrefix(attempt.input, savedAttempt.input),
    );

    if (matchingIndex === -1) {
      merged.push(attempt);
      continue;
    }

    if (
      merged[matchingIndex] &&
      attempt.input.turns.length >= merged[matchingIndex].input.turns.length
    ) {
      merged[matchingIndex] = attempt;
    }
  }

  return merged.slice(-20);
}

export function loadPictureAssessmentHistory(
  storage: Storage = localStorage,
): PictureAssessmentAttempt[] {
  const storedHistory = storage.getItem(pictureAssessmentHistoryStorageKey);

  if (!storedHistory) {
    return [];
  }

  try {
    const parsedHistory = pictureAssessmentHistorySchema.safeParse(
      JSON.parse(storedHistory) as unknown,
    );

    if (parsedHistory.success) {
      return parsedHistory.data;
    }
  } catch {
    // Invalid prototype data is cleared below.
  }

  storage.removeItem(pictureAssessmentHistoryStorageKey);
  return [];
}

export function archivePictureAssessment(
  attempt: PictureAssessmentAttempt,
  storage: Storage = localStorage,
) {
  const parsedAttempt = pictureAssessmentAttemptSchema.parse(attempt);
  const nextHistory = mergePictureAssessmentAttempts([
    ...loadPictureAssessmentHistory(storage),
    parsedAttempt,
  ]);

  storage.setItem(
    pictureAssessmentHistoryStorageKey,
    JSON.stringify(nextHistory),
  );

  return nextHistory;
}
