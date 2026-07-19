import { describe, expect, it } from "vitest";

import { selectFollowUpQuestion } from "./follow-up-question";

const commonInput = {
  focusTopic: "the boy running to his grandfather",
  previousQuestions: ["Can you describe what you see in this picture?"],
  hasEstablishedPersonalExperience: false,
  sceneFallbackQuestion:
    "What is happening between the boy and his grandfather?",
} as const;

describe("selectFollowUpQuestion", () => {
  it("replaces a valid picture-detail question with a personal conversation starter", () => {
    const followUp = selectFollowUpQuestion({
      ...commonInput,
      allowVisualQuestion: false,
      forceConversationProgression: true,
      modelQuestion:
        "Can you describe the boy running to his grandfather in more detail?",
      modelQuestionType: "picture_follow_up",
    });

    expect(followUp.nextQuestion).toContain("experience from your own life");
    expect(followUp.nextQuestion).not.toContain("more detail");
    expect(followUp.nextQuestionType).toBe("personal_follow_up");
  });

  it("keeps a new personal model question on the active thread", () => {
    const modelQuestion =
      "Have you ever met a relative after a long journey? Tell me about it.";
    const followUp = selectFollowUpQuestion({
      ...commonInput,
      allowVisualQuestion: false,
      forceConversationProgression: true,
      modelQuestion,
      modelQuestionType: "personal_follow_up",
    });

    expect(followUp).toEqual({
      nextQuestion: modelQuestion,
      nextQuestionType: "personal_follow_up",
    });
  });

  it("moves forward through the personal conversation ladder", () => {
    const firstFollowUp =
      "Does the boy running to his grandfather remind you of a similar experience from your own life? Tell me about it.";
    const followUp = selectFollowUpQuestion({
      ...commonInput,
      allowVisualQuestion: false,
      forceConversationProgression: true,
      hasEstablishedPersonalExperience: true,
      modelQuestion: firstFollowUp,
      modelQuestionType: "personal_follow_up",
      previousQuestions: [...commonInput.previousQuestions, firstFollowUp],
    });

    expect(followUp.nextQuestion).toBe(
      "What happened next in that experience?",
    );
    expect(followUp.nextQuestionType).toBe("personal_follow_up");
  });

  it("allows a picture redirect after an irrelevant answer", () => {
    const correctiveQuestion =
      "Let’s return to the picture. What is the boy doing near his grandfather?";
    const followUp = selectFollowUpQuestion({
      ...commonInput,
      allowVisualQuestion: true,
      forceConversationProgression: false,
      modelQuestion: correctiveQuestion,
      modelQuestionType: "picture_follow_up",
    });

    expect(followUp).toEqual({
      nextQuestion: correctiveQuestion,
      nextQuestionType: "picture_follow_up",
    });
  });

  it("uses a picture correction when no topic has been established", () => {
    const sceneFallback = "What is one clear action in the picture?";
    const followUp = selectFollowUpQuestion({
      allowVisualQuestion: true,
      focusTopic: "",
      forceConversationProgression: false,
      hasEstablishedPersonalExperience: false,
      modelQuestion: sceneFallback,
      modelQuestionType: "picture_follow_up",
      previousQuestions: [sceneFallback],
      sceneFallbackQuestion: sceneFallback,
    });

    expect(followUp.nextQuestion).toContain("return to the picture");
    expect(followUp.nextQuestionType).toBe("picture_follow_up");
  });

  it("does not skip into a dependent experience question after picture corrections", () => {
    const followUp = selectFollowUpQuestion({
      ...commonInput,
      allowVisualQuestion: false,
      forceConversationProgression: true,
      modelQuestion: "What happened next in that experience?",
      modelQuestionType: "personal_follow_up",
      previousQuestions: [
        "Can you describe what you see in this picture?",
        "What are the children doing with the kite?",
        "What might happen next with the kite?",
      ],
    });

    expect(followUp.nextQuestion).toContain("experience from your own life");
    expect(followUp.nextQuestion).not.toContain("What happened next");
  });

  it("rejects a visual question even when the model labels it personal", () => {
    const followUp = selectFollowUpQuestion({
      ...commonInput,
      allowVisualQuestion: false,
      forceConversationProgression: true,
      modelQuestion:
        "What do you think might happen next with the red kite in the picture?",
      modelQuestionType: "personal_follow_up",
    });

    expect(followUp.nextQuestion).toContain("experience from your own life");
    expect(followUp.nextQuestion).not.toContain("in the picture");
  });
});
