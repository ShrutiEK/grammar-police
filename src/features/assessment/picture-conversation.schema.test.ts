import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  METRIC_IDS,
  createPictureConversationProviderMetricSchema,
  parsePictureConversationProviderMetric,
  pictureConversationAssessmentSchema,
} from "./picture-conversation.schema";

function createAssessment(metricIds: readonly string[] = METRIC_IDS) {
  return {
    learnerSummary: "You shared clear ideas about the picture.",
    metrics: metricIds.map((id) => ({
      confidence: "low",
      evidence: [],
      id,
      status: "not_assessed",
      unavailableReason: "We need another example to understand this.",
    })),
    primaryRecommendation: {
      reason: "Practise adding one more detail to each answer.",
      skill: "detail_expansion" as const,
      track: "expression" as const,
    },
  };
}

describe("picture conversation assessment schema", () => {
  it("requires a result for every metric", () => {
    expect(
      pictureConversationAssessmentSchema.safeParse(createAssessment()).success,
    ).toBe(true);
  });

  it("rejects an assessment that omits a metric", () => {
    expect(
      pictureConversationAssessmentSchema.safeParse(
        createAssessment(METRIC_IDS.slice(1)),
      ).success,
    ).toBe(false);
  });

  it("generates a fixed schema for one requested metric", () => {
    expect(
      z.toJSONSchema(createPictureConversationProviderMetricSchema("grammar")),
    ).toMatchObject({
      properties: {
        metricId: {
          const: "grammar",
        },
        nextSkill: {
          enum: expect.arrayContaining([
            "articles",
            "subject_verb_agreement",
            "none",
          ]),
        },
      },
      type: "object",
    });
  });

  it("converts one assessed provider metric to the application format", () => {
    expect(
      parsePictureConversationProviderMetric("grammar", {
        band: "developing",
        confidence: "high",
        evidenceQuote: "The children is playing.",
        evidenceTurn: "scene_description",
        metricId: "grammar",
        nextSkill: "subject_verb_agreement",
        observation: "The plural subject needs a matching verb.",
        strength: "You shared a complete idea.",
        unavailableReason: "",
      }),
    ).toEqual({
      band: "developing",
      confidence: "high",
      evidence: [
        {
          learnerText: "The children is playing.",
          observation: "The plural subject needs a matching verb.",
          turn: "scene_description",
        },
      ],
      id: "grammar",
      nextSkill: "subject_verb_agreement",
      status: "assessed",
      strength: "You shared a complete idea.",
    });
  });

  it("converts unavailable provider evidence without assigning a low band", () => {
    expect(
      parsePictureConversationProviderMetric("spoken_fluency", {
        band: "not_assessed",
        confidence: "low",
        evidenceQuote: "",
        evidenceTurn: "none",
        metricId: "spoken_fluency",
        nextSkill: "none",
        observation: "",
        strength: "",
        unavailableReason: "The recording duration is unavailable.",
      }),
    ).toEqual({
      confidence: "low",
      evidence: [],
      id: "spoken_fluency",
      status: "not_assessed",
      unavailableReason: "The recording duration is unavailable.",
    });
  });

  it("rejects a skill belonging to another metric", () => {
    expect(() =>
      parsePictureConversationProviderMetric("grammar", {
        band: "developing",
        confidence: "high",
        evidenceQuote: "The children is playing.",
        evidenceTurn: "scene_description",
        metricId: "grammar",
        nextSkill: "spatial_language",
        observation: "The plural subject needs a matching verb.",
        strength: "You shared a complete idea.",
        unavailableReason: "",
      }),
    ).toThrow();
  });
});
