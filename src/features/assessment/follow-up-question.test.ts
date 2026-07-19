import { describe, expect, it } from "vitest";

import { selectFollowUpQuestion } from "./follow-up-question";

describe("selectFollowUpQuestion", () => {
  it("accepts a new contextual question that uses a pronoun", () => {
    const question = selectFollowUpQuestion({
      modelQuestion: "Why do you think they are enjoying it?",
      focusTopic: "the children flying the kite",
      previousQuestions: [
        "Can you describe what you see in this picture?",
        "What are the children doing with the kite?",
      ],
      sceneFallbackQuestion:
        "What are the two children doing with the red kite?",
    });

    expect(question).toBe("Why do you think they are enjoying it?");
  });

  it("replaces a repeated model question with a new fallback", () => {
    const repeatedQuestion = "What are the children doing with the kite?";
    const question = selectFollowUpQuestion({
      modelQuestion: repeatedQuestion,
      focusTopic: "the children flying the kite",
      previousQuestions: [repeatedQuestion],
      sceneFallbackQuestion:
        "What are the two children doing with the red kite?",
    });

    expect(question).not.toBe(repeatedQuestion);
    expect(question).toContain("kite");
  });

  it("does not reuse the same fallback on later turns", () => {
    const firstFallback =
      "What visible detail about the children flying the kite have you not described yet?";
    const question = selectFollowUpQuestion({
      modelQuestion: "What are the children doing with the kite?",
      focusTopic: "the children flying the kite",
      previousQuestions: [
        "What are the children doing with the kite?",
        firstFallback,
      ],
      sceneFallbackQuestion:
        "What are the two children doing with the red kite?",
    });

    expect(question).not.toBe(firstFallback);
    expect(question).toContain("kite");
  });

  it("uses a different corrective question when no topic is locked", () => {
    const sceneFallback =
      "Look at the foreground. What are the children doing with the kite?";
    const question = selectFollowUpQuestion({
      modelQuestion: sceneFallback,
      focusTopic: "",
      previousQuestions: [sceneFallback],
      sceneFallbackQuestion: sceneFallback,
    });

    expect(question).not.toBe(sceneFallback);
  });
});
