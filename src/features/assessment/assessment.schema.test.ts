import { describe, expect, it } from "vitest";

import { learnerAssessmentSchema } from "./assessment.schema";

const validAssessment = {
  cefrLevel: "A2",
  vocabulary: { score: 55, evidence: "Used varied classroom nouns." },
  grammar: { score: 45, evidence: "Sometimes omitted articles." },
  sentenceComplexity: { score: 40, evidence: "Mostly used short sentences." },
  fluencyScore: 58,
  confidenceScore: 64,
  strengths: ["Clear everyday vocabulary"],
  learningGaps: ["Using articles consistently"],
  recommendedNextLesson: "Articles in picture descriptions",
};

describe("learnerAssessmentSchema", () => {
  it("accepts a complete learner assessment", () => {
    expect(learnerAssessmentSchema.safeParse(validAssessment).success).toBe(
      true,
    );
  });

  it("rejects scores outside the supported range", () => {
    const result = learnerAssessmentSchema.safeParse({
      ...validAssessment,
      fluencyScore: 101,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an assessment without a recommended lesson", () => {
    const result = learnerAssessmentSchema.safeParse({
      ...validAssessment,
      recommendedNextLesson: "",
    });

    expect(result.success).toBe(false);
  });
});
