import { describe, expect, it } from "vitest";

import { learnerAssessmentSchema } from "./assessment.schema";

const validAssessment = {
  grammar_score: 80,
  vocabulary_score: 85,
  communication_score: 90,
  pronunciation_score: 75,
  grammatical_errors: ["Missing article 'the' before 'children'."],
  vocabulary_errors: [],
  mastered_skills: ["Correctly identified children playing football."],
  child_friendly_feedback:
    "Great job describing the children playing football!",
};

describe("learnerAssessmentSchema", () => {
  it("accepts a complete learner assessment", () => {
    expect(learnerAssessmentSchema.safeParse(validAssessment).success).toBe(
      true,
    );
  });

  it("rejects an assessment missing feedback", () => {
    const result = learnerAssessmentSchema.safeParse({
      ...validAssessment,
      child_friendly_feedback: "",
    });

    expect(result.success).toBe(false);
  });
});
