import { describe, expect, it } from "vitest";

import {
  createPersonalisedLesson,
  evaluateLessonChoice,
} from "./create-personalised-lesson";
import { demoLessonAssessment } from "./demo-assessment";

describe("createPersonalisedLesson", () => {
  it("creates one adjective mission from the evidence-backed recommendation", () => {
    const lesson = createPersonalisedLesson(demoLessonAssessment);
    expect(lesson.skill).toBe("descriptive_adjectives");
    expect(lesson.missionTitle).toBe("Upgrade the Scene!");
    expect(lesson.rounds).toHaveLength(3);
    expect(lesson.learnerEvidence).toContain("There is a kite");
    expect(lesson.startingBand).toBe("emerging");
    expect(lesson.observation).toContain("few descriptive details");
  });

  it("recovers with the lowest-band metric and grammar-first tie-break", () => {
    const evidenceBackedMetric = demoLessonAssessment.metrics[0]!;
    const lesson = createPersonalisedLesson({
      ...demoLessonAssessment,
      metrics: [
        {
          ...evidenceBackedMetric,
          id: "vocabulary",
          band: "emerging",
          nextSkill: "descriptive_adjectives",
        },
        {
          ...evidenceBackedMetric,
          id: "grammar",
          band: "emerging",
          nextSkill: "articles",
        },
      ],
      primaryRecommendation: {
        track: "expression",
        skill: "detail_expansion",
        reason: "Unsupported recommendation.",
      },
    });
    expect(lesson.skill).toBe("articles");
    expect(lesson.track).toBe("grammar");
  });

  it("refuses to invent a lesson without assessed evidence", () => {
    expect(() =>
      createPersonalisedLesson({
        ...demoLessonAssessment,
        metrics: [
          {
            id: "vocabulary",
            status: "not_assessed",
            confidence: "low",
            evidence: [],
            unavailableReason: "Too little language.",
          },
        ],
      }),
    ).toThrow("evidence-backed next skill");
  });

  it("returns an immediate hint or success message", () => {
    const lesson = createPersonalisedLesson(demoLessonAssessment);
    expect(evaluateLessonChoice(lesson, 0, 0)).toEqual({
      isCorrect: false,
      message: lesson.rounds[0]?.hint,
    });
    expect(evaluateLessonChoice(lesson, 0, 1)).toEqual({
      isCorrect: true,
      message: lesson.rounds[0]?.successMessage,
    });
  });

  it("does not route a pronunciation-only recommendation to text exercises", () => {
    expect(() =>
      createPersonalisedLesson({
        ...demoLessonAssessment,
        metrics: [
          {
            ...demoLessonAssessment.metrics[0],
            id: "pronunciation",
            nextSkill: "word_stress",
          },
        ],
        primaryRecommendation: {
          track: "pronunciation",
          skill: "word_stress",
          reason: "Unsupported without audio-aware evidence.",
        },
      }),
    ).toThrow("evidence-backed next skill");
  });
});
