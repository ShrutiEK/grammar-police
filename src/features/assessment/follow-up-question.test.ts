import { describe, expect, it } from "vitest";

import { selectFollowUpQuestion } from "./follow-up-question";

describe("selectFollowUpQuestion", () => {
  it("keeps the type of a new contextual model question", () => {
    const followUp = selectFollowUpQuestion({
      modelQuestion: "Why do you think they are enjoying it?",
      modelQuestionType: "picture_follow_up",
      focusTopic: "the children flying the kite",
      previousQuestions: [
        "Can you describe what you see in this picture?",
        "What are the children doing with the kite?",
      ],
      sceneFallbackQuestion:
        "What are the two children doing with the red kite?",
    });

    expect(followUp).toEqual({
      nextQuestion: "Why do you think they are enjoying it?",
      nextQuestionType: "picture_follow_up",
    });
  });

  it("replaces a repeated model question with a typed fallback", () => {
    const repeatedQuestion = "What are the children doing with the kite?";
    const followUp = selectFollowUpQuestion({
      modelQuestion: repeatedQuestion,
      modelQuestionType: "picture_follow_up",
      focusTopic: "the children flying the kite",
      previousQuestions: [repeatedQuestion],
      sceneFallbackQuestion:
        "What are the two children doing with the red kite?",
    });

    expect(followUp.nextQuestion).not.toBe(repeatedQuestion);
    expect(followUp.nextQuestion).toContain("kite");
    expect(followUp.nextQuestionType).toBe("picture_follow_up");
  });

  it("keeps a personal model follow-up when it is new and on topic", () => {
    const followUp = selectFollowUpQuestion({
      modelQuestion:
        "Have you ever flown a kite with someone? Tell me about it.",
      modelQuestionType: "personal_follow_up",
      focusTopic: "the children flying the kite",
      previousQuestions: ["Can you describe what you see in this picture?"],
      sceneFallbackQuestion:
        "What are the two children doing with the red kite?",
    });

    expect(followUp.nextQuestionType).toBe("personal_follow_up");
  });

  it("uses a picture follow-up when no topic is locked", () => {
    const sceneFallback =
      "Look at the foreground. What are the children doing with the kite?";
    const followUp = selectFollowUpQuestion({
      modelQuestion: sceneFallback,
      modelQuestionType: "picture_follow_up",
      focusTopic: "",
      previousQuestions: [sceneFallback],
      sceneFallbackQuestion: sceneFallback,
    });

    expect(followUp.nextQuestion).not.toBe(sceneFallback);
    expect(followUp.nextQuestionType).toBe("picture_follow_up");
  });
});
