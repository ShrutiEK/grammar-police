const unmistakableRomanisedHindiWords = new Set([
  "accha",
  "acha",
  "bahut",
  "baccha",
  "bacche",
  "bacchi",
  "hain",
  "karna",
  "karte",
  "karti",
  "kyun",
  "nahi",
  "raha",
  "rahe",
  "rahi",
  "tha",
  "thi",
]);

const contextualRomanisedHindiWords = new Set([
  "aur",
  "hai",
  "ka",
  "ke",
  "ki",
  "ko",
  "mein",
  "par",
  "se",
  "vo",
  "woh",
  "ye",
  "yeh",
]);

const nonEnglishScriptPattern =
  /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E00-\u0E7F\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

export function containsNonEnglishLanguage(text: string) {
  if (nonEnglishScriptPattern.test(text)) {
    return true;
  }

  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];

  if (words.some((word) => unmistakableRomanisedHindiWords.has(word))) {
    return true;
  }

  const contextualHindiWordCount = words.filter((word) =>
    contextualRomanisedHindiWords.has(word),
  ).length;

  return contextualHindiWordCount >= 2;
}

type EnforceEnglishOnlyResponseInput = Readonly<{
  assessment: LearnerAssessment;
  transcript: string;
  existingFocusTopic: string | null;
  fallbackQuestion: string;
}>;

export function enforceEnglishOnlyResponse({
  assessment,
  transcript,
  existingFocusTopic,
  fallbackQuestion,
}: EnforceEnglishOnlyResponseInput): LearnerAssessment {
  const learnerUsedNonEnglish = containsNonEnglishLanguage(transcript);
  const modelReturnedNonEnglish = containsNonEnglishLanguage(
    [
      assessment.feedback,
      assessment.languageHint,
      assessment.focusTopic,
      assessment.nextQuestion,
    ].join(" "),
  );

  if (!learnerUsedNonEnglish && !modelReturnedNonEnglish) {
    return assessment;
  }

  const safeFocusTopic =
    existingFocusTopic && !containsNonEnglishLanguage(existingFocusTopic)
      ? existingFocusTopic
      : null;
  const nextQuestion = safeFocusTopic
    ? `Please answer in English. What else do you notice about ${safeFocusTopic}?`
    : `Please answer in English. ${fallbackQuestion}`;

  return {
    ...assessment,
    feedback:
      "Please answer in English so I can assess your communication skills accurately.",
    languageWarning: true,
    languageHint:
      "Please answer in English only. Avoid mixing English with another language.",
    isGrounded: learnerUsedNonEnglish ? false : assessment.isGrounded,
    isRelevantToFocus: learnerUsedNonEnglish
      ? false
      : assessment.isRelevantToFocus,
    focusTopic: safeFocusTopic ?? "",
    nextQuestion,
  };
}
import type { LearnerAssessment } from "./assessment.schema";
