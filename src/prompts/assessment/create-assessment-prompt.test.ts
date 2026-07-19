import { describe, expect, it } from "vitest";

import { createAssessmentPrompt } from "./create-assessment-prompt";

const baseInput = {
  conversationContext: [],
  currentQuestion: "What do you enjoy doing in your free time?",
  currentQuestionType: "personal_follow_up" as const,
  focusTopic: "Hobbies",
  pictureDescription: "A picture that must not be used in Pari mode.",
  transcript: "I enjoy painting because it helps me relax.",
};

describe("createAssessmentPrompt", () => {
  it("keeps DM with Pari grounded in the chosen topic without visual questions", () => {
    const prompt = createAssessmentPrompt({
      ...baseInput,
      conversationMode: "pari",
      conversationTopic: "Hobbies",
    });

    expect(prompt).toContain("does not use an image");
    expect(prompt).toContain("every nextQuestion must be personal_follow_up");
    expect(prompt).not.toContain("A picture that must not be used");
  });

  it("retains trusted scene grounding for picture conversations", () => {
    const prompt = createAssessmentPrompt({
      ...baseInput,
      conversationMode: "picture",
      conversationTopic: null,
    });

    expect(prompt).toContain("PICTURE DESCRIPTION");
    expect(prompt).toContain("A picture that must not be used");
  });
});
