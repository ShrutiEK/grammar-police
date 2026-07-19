import { describe, expect, it } from "vitest";

import type { PictureConversationMetricResult } from "./picture-conversation.schema";
import { validateMetricFinding } from "./validate-metric-finding";

function createArticlesFinding(
  learnerText: string,
  correctedText: string,
): PictureConversationMetricResult {
  return {
    band: "developing",
    confidence: "high",
    evidence: [
      {
        correctedText,
        learnerText,
        observation: "The noun phrase needs an article.",
        turn: "scene_description",
      },
    ],
    findingStatus: "supported",
    id: "grammar",
    nextSkill: "articles",
    status: "assessed",
    strength: "You communicated the main idea.",
  };
}

describe("metric finding validation", () => {
  it("rejects a contraction correction classified as articles", () => {
    expect(() =>
      validateMetricFinding(
        createArticlesFinding(
          "Shes playing football.",
          "She's playing football.",
        ),
      ),
    ).toThrow("must change a, an, or the");
  });

  it("accepts a correction that adds a missing article", () => {
    expect(
      validateMetricFinding(
        createArticlesFinding("She has dog.", "She has a dog."),
      ),
    ).toMatchObject({ nextSkill: "articles" });
  });

  it("accepts a correction that changes a to an", () => {
    expect(
      validateMetricFinding(
        createArticlesFinding("She has a orange.", "She has an orange."),
      ),
    ).toMatchObject({ nextSkill: "articles" });
  });
});
