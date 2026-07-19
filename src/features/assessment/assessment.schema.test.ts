import { describe, expect, it } from "vitest";

import { learnerAssessmentSchema } from "./assessment.schema";

const validAssessment = {
  scores: {
    vocabulary: 4,
    grammar: 3,
    reasoning: 4,
    sentenceComplexity: 3,
    communication: 4,
  },
  feedback:
    "You named the action clearly. Try joining your ideas with 'because'.",
  languageWarning: false,
  languageHint: "",
  isGrounded: true,
  isRelevantToFocus: true,
  focusTopic: "the children flying the kite",
  nextQuestion: "Why do you think the children enjoy flying the kite?",
};

describe("learnerAssessmentSchema", () => {
  it("accepts a complete turn assessment", () => {
    expect(learnerAssessmentSchema.safeParse(validAssessment).success).toBe(
      true,
    );
  });

  it("rejects scores outside the 1 to 5 range", () => {
    const result = learnerAssessmentSchema.safeParse({
      ...validAssessment,
      scores: { ...validAssessment.scores, communication: 6 },
    });

    expect(result.success).toBe(false);
  });

  it("rejects an assessment without a follow-up question", () => {
    const result = learnerAssessmentSchema.safeParse({
      ...validAssessment,
      nextQuestion: "",
    });

    expect(result.success).toBe(false);
  });
});
