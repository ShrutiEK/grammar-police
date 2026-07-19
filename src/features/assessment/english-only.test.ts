import { describe, expect, it } from "vitest";

import {
  containsNonEnglishLanguage,
  enforceEnglishOnlyResponse,
} from "./english-only";

const validEnglishAssessment = {
  scores: {
    vocabulary: 3,
    grammar: 3,
    reasoning: 3,
    sentenceComplexity: 3,
    communication: 3,
  },
  feedback: "You described the action clearly.",
  languageWarning: false,
  languageHint: "",
  isGrounded: true,
  isRelevantToFocus: true,
  focusTopic: "the children flying the kite",
  nextQuestion: "Why do you think they are flying the kite?",
};

describe("containsNonEnglishLanguage", () => {
  it("detects answers written in a non-English script", () => {
    expect(containsNonEnglishLanguage("बच्चे पतंग उड़ा रहे हैं।")).toBe(true);
  });

  it("detects Romanised Hindi and Hinglish", () => {
    expect(containsNonEnglishLanguage("The bacche kite uda rahe hain.")).toBe(
      true,
    );
    expect(containsNonEnglishLanguage("The dog park mein hai.")).toBe(true);
  });

  it("does not reject an ordinary English answer", () => {
    expect(
      containsNonEnglishLanguage(
        "The children are flying a red kite near their dog.",
      ),
    ).toBe(false);
  });

  it("replaces all learner-facing output after a non-English answer", () => {
    const result = enforceEnglishOnlyResponse({
      assessment: {
        ...validEnglishAssessment,
        feedback: "Aapne sahi jawab diya hai.",
        nextQuestion: "Bacche kya kar rahe hain?",
      },
      transcript: "Bacche kite uda rahe hain.",
      existingFocusTopic: null,
      fallbackQuestion: "What are the children doing with the kite?",
    });

    expect(result.languageWarning).toBe(true);
    expect(result.isGrounded).toBe(false);
    expect(result.isRelevantToFocus).toBe(false);
    expect(result.feedback).toBe(
      "Please answer in English so I can assess your communication skills accurately.",
    );
    expect(result.nextQuestion).toBe(
      "Please answer in English. What are the children doing with the kite?",
    );
    expect(containsNonEnglishLanguage(result.nextQuestion)).toBe(false);
  });

  it("sanitizes non-English model output even after an English answer", () => {
    const result = enforceEnglishOnlyResponse({
      assessment: {
        ...validEnglishAssessment,
        nextQuestion: "Aap aur kya dekh rahe hain?",
      },
      transcript: "The children are flying a kite.",
      existingFocusTopic: "the children flying the kite",
      fallbackQuestion: "What are the children doing with the kite?",
    });

    expect(result.nextQuestion).toBe(
      "Please answer in English. What else do you notice about the children flying the kite?",
    );
    expect(containsNonEnglishLanguage(result.nextQuestion)).toBe(false);
  });
});
