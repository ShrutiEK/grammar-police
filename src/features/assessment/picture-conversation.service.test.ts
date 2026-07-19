import { describe, expect, it } from "vitest";

import {
  pictureConversationResponseSchema,
  type PictureConversationAssessment,
} from "./picture-conversation.schema";
import {
  createPictureConversationFeedback,
  getNextConversationPrompt,
} from "./picture-conversation-feedback";

const completeAssessment: PictureConversationAssessment = {
  learnerSummary:
    "You described the picture clearly and shared a personal example.",
  metrics: [
    {
      band: "secure",
      confidence: "high",
      evidence: [
        {
          learnerText: "children playing football",
          observation: "Names people and an action clearly.",
          turn: "scene_description",
        },
      ],
      id: "scene_understanding",
      nextSkill: "spatial_language",
      status: "assessed",
      strength: "You noticed a clear action in the picture.",
    },
  ],
  primaryRecommendation: {
    reason: "Adding location words can make picture descriptions even clearer.",
    skill: "spatial_language",
    track: "scene_description",
  },
};

describe("picture conversation feedback", () => {
  it("returns complete feedback without asking for more conversation", () => {
    const feedback = createPictureConversationFeedback(completeAssessment);

    expect(feedback.status).toBe("assessed");
    expect(feedback.assessment).toEqual(completeAssessment);
    expect(feedback.nextConversationPrompt).toBeUndefined();
  });

  it("keeps available feedback and suggests a conversation prompt for missing evidence", () => {
    const partialAssessment: PictureConversationAssessment = {
      ...completeAssessment,
      metrics: [
        ...completeAssessment.metrics,
        {
          confidence: "low",
          evidence: [],
          id: "conversation",
          status: "not_assessed",
          unavailableReason: "The learner did not answer a personal follow-up.",
        },
      ],
    };

    const feedback = createPictureConversationFeedback(partialAssessment);

    expect(feedback.assessment.metrics).toHaveLength(2);
    expect(feedback.nextConversationPrompt).toMatch(/personal detail/i);
  });

  it("uses a picture-detail prompt when scene understanding needs more evidence", () => {
    const assessment: PictureConversationAssessment = {
      ...completeAssessment,
      metrics: [
        {
          confidence: "low",
          evidence: [],
          id: "scene_understanding",
          status: "not_assessed",
          unavailableReason: "The response does not describe the picture.",
        },
      ],
    };

    expect(getNextConversationPrompt(assessment)).toMatch(/who or what/i);
  });

  it("accepts a friendly retry response when feedback is temporarily unavailable", () => {
    expect(
      pictureConversationResponseSchema.safeParse({
        message:
          "We couldn’t finish your feedback right now. Please try again in a moment.",
        status: "retry_later",
      }).success,
    ).toBe(true);
  });
});
