import { describe, expect, it, vi } from "vitest";

import {
  assessPictureConversationMetricsIndividually,
  getEligiblePictureConversationMetricIds,
} from "./picture-conversation-metric-assessment";
import type {
  AssessableMetricId,
  PictureConversationAssessmentInput,
  PictureConversationMetricResult,
} from "./picture-conversation.schema";

const writtenInput: PictureConversationAssessmentInput = {
  pictureDescription: "Two children are flying a red kite in a park.",
  turns: [
    {
      answerMode: "written",
      isGrounded: true,
      isRelevantToFocus: true,
      kind: "scene_description",
      languageWarning: false,
      prompt: "What can you see?",
      responseText: "Two children are flying a kite.",
    },
    {
      answerMode: "written",
      isGrounded: true,
      isRelevantToFocus: true,
      kind: "personal_follow_up",
      languageWarning: false,
      prompt: "Have you flown a kite?",
      responseText: "I flew a kite with my sister.",
    },
  ],
};

const nextSkillByMetric = {
  conversation: "answer_expansion",
  expression: "sentence_connectors",
  grammar: "articles",
  scene_understanding: "scene_detail_noticing",
  spoken_fluency: "filler_reduction",
  vocabulary: "precise_nouns",
  writing_conventions: "punctuation",
} as const satisfies Record<AssessableMetricId, string>;

function createMetric(
  metricId: AssessableMetricId,
): PictureConversationMetricResult {
  return {
    band: "developing",
    confidence: "high",
    evidence: [
      {
        learnerText: "Two children are flying a kite.",
        observation: "The response gives one clear idea.",
        turn: "scene_description",
      },
    ],
    id: metricId,
    nextSkill: nextSkillByMetric[metricId],
    status: "assessed",
    strength: "You shared one clear idea.",
  };
}

describe("picture conversation per-metric assessment", () => {
  it("includes speaking flow when a spoken turn has recording duration", () => {
    expect(
      getEligiblePictureConversationMetricIds({
        ...writtenInput,
        turns: [
          {
            ...writtenInput.turns[0]!,
            answerMode: "spoken",
            audioDurationInSeconds: 12,
          },
        ],
      }),
    ).toEqual([
      "scene_understanding",
      "grammar",
      "vocabulary",
      "expression",
      "spoken_fluency",
    ]);
  });

  it("never sends pronunciation to a provider", () => {
    expect(getEligiblePictureConversationMetricIds(writtenInput)).not.toContain(
      "pronunciation",
    );
  });

  it("combines successful metric calls and marks unavailable metrics locally", async () => {
    const assessMetric = vi.fn(async (metricId: AssessableMetricId) =>
      createMetric(metricId),
    );

    const assessment = await assessPictureConversationMetricsIndividually(
      writtenInput,
      {
        assessMetric,
        providerName: "Test provider",
      },
    );

    expect(assessment.metrics).toHaveLength(8);
    expect(
      assessment.metrics.find((metric) => metric.id === "pronunciation"),
    ).toMatchObject({
      status: "not_assessed",
      unavailableReason: "Coming soon.",
    });
    expect(
      assessment.metrics.find((metric) => metric.id === "spoken_fluency"),
    ).toMatchObject({
      status: "not_assessed",
    });
    expect(assessMetric).toHaveBeenCalledTimes(6);
  });

  it("reports each calculated metric before summarizing the assessment", async () => {
    const reportProgress = vi.fn();

    await assessPictureConversationMetricsIndividually(
      writtenInput,
      {
        assessMetric: async (metricId) => createMetric(metricId),
        providerName: "Test provider",
      },
      reportProgress,
    );

    expect(reportProgress).toHaveBeenNthCalledWith(1, {
      completedMetricIds: [],
      stage: "calculating",
      totalMetrics: 6,
    });
    expect(reportProgress).toHaveBeenCalledWith({
      completedMetricIds: [
        "scene_understanding",
        "grammar",
        "vocabulary",
        "expression",
        "conversation",
        "writing_conventions",
      ],
      stage: "summarizing",
      totalMetrics: 6,
    });
    expect(reportProgress).toHaveBeenCalledTimes(8);
  });

  it("keeps partial results when another metric call fails", async () => {
    const assessment = await assessPictureConversationMetricsIndividually(
      writtenInput,
      {
        assessMetric: async (metricId) => {
          if (metricId !== "grammar") {
            throw new Error("Metric unavailable.");
          }

          return createMetric(metricId);
        },
        providerName: "Test provider",
      },
    );

    expect(
      assessment.metrics.find((metric) => metric.id === "grammar"),
    ).toMatchObject({
      status: "assessed",
    });
    expect(
      assessment.metrics.find((metric) => metric.id === "vocabulary"),
    ).toMatchObject({
      status: "not_assessed",
    });
  });

  it("fails the provider when no metric can be assessed", async () => {
    await expect(
      assessPictureConversationMetricsIndividually(writtenInput, {
        assessMetric: async () => {
          throw new Error("Metric unavailable.");
        },
        providerName: "Test provider",
      }),
    ).rejects.toThrow("did not return an assessed metric");
  });

  it("does not force a recommendation when assessed evidence shows no gap", async () => {
    const assessment = await assessPictureConversationMetricsIndividually(
      writtenInput,
      {
        assessMetric: async (metricId) => ({
          band: "strong",
          confidence: "high",
          evidence: [
            {
              learnerText: "Two children are flying a kite.",
              observation: "The response is accurate and clear.",
              turn: "scene_description",
            },
          ],
          findingStatus: "no_gap",
          id: metricId,
          status: "assessed",
          strength: "You communicated this clearly.",
        }),
        providerName: "Test provider",
      },
    );

    expect(assessment.primaryRecommendation).toBeUndefined();
    expect(assessment.learnerSummary).toContain(
      "No single learning gap stood out",
    );
  });
});
