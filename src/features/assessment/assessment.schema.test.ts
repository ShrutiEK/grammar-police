import { describe, expect, it } from "vitest";

import { learnerAssessmentSchema } from "./assessment.schema";

const validAssessment = {
  languageWarning: false,
  languageHint: "",
  isGrounded: true,
  isRelevantToFocus: true,
  focusTopic: "the children flying the kite",
  nextQuestion: "Why do you think the children enjoy flying the kite?",
  nextQuestionType: "picture_follow_up",
};

describe("learnerAssessmentSchema", () => {
  it("accepts a complete turn assessment", () => {
    expect(learnerAssessmentSchema.safeParse(validAssessment).success).toBe(
      true,
    );
  });

  it("rejects an unknown follow-up type", () => {
    const result = learnerAssessmentSchema.safeParse({
      ...validAssessment,
      nextQuestionType: "unknown",
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
