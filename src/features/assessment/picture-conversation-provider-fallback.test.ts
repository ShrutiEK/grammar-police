import { describe, expect, it, vi } from "vitest";

import type {
  PictureConversationAssessment,
  PictureConversationAssessmentInput,
} from "./picture-conversation.schema";
import { assessWithProviderFallback } from "./picture-conversation-provider-fallback";
import { samplePictureConversation } from "./sample-picture-conversation.data";

const sampleAssessmentInput: PictureConversationAssessmentInput = {
  pictureDescription:
    "Families are having a picnic in a park while two children fly a red kite.",
  turns: samplePictureConversation.turns,
};

const assessment: PictureConversationAssessment = {
  learnerSummary: "You described the picture clearly.",
  metrics: [
    {
      band: "secure",
      confidence: "high",
      evidence: [
        {
          learnerText: "children are playing football",
          observation: "Describes a clear action.",
          turn: "scene_description",
        },
      ],
      id: "scene_understanding",
      status: "assessed",
    },
  ],
  primaryRecommendation: {
    reason: "More location words can make descriptions clearer.",
    skill: "spatial_language",
    track: "scene_description",
  },
};

function createProvider(response: Promise<PictureConversationAssessment>) {
  return vi.fn<
    (
      input: PictureConversationAssessmentInput,
    ) => Promise<PictureConversationAssessment>
  >(() => response);
}

describe("picture conversation provider fallback", () => {
  it("uses Sarvam when its assessment succeeds", async () => {
    const assessWithSarvam = createProvider(Promise.resolve(assessment));
    const assessWithOpenAi = createProvider(Promise.resolve(assessment));

    const result = await assessWithProviderFallback(sampleAssessmentInput, {
      assessWithOpenAi,
      assessWithSarvam,
    });

    expect(result).toEqual(assessment);
    expect(assessWithOpenAi).not.toHaveBeenCalled();
  });

  it("uses OpenAI when Sarvam cannot complete the assessment", async () => {
    const assessWithSarvam = createProvider(
      Promise.reject(new Error("Sarvam is unavailable.")),
    );
    const assessWithOpenAi = createProvider(Promise.resolve(assessment));

    const result = await assessWithProviderFallback(sampleAssessmentInput, {
      assessWithOpenAi,
      assessWithSarvam,
    });

    expect(result).toEqual(assessment);
    expect(assessWithOpenAi).toHaveBeenCalledWith(
      sampleAssessmentInput,
      expect.any(Function),
    );
  });

  it("returns an error when neither provider can complete the assessment", async () => {
    const assessWithSarvam = createProvider(
      Promise.reject(new Error("Sarvam is unavailable.")),
    );
    const assessWithOpenAi = createProvider(
      Promise.reject(new Error("OpenAI is unavailable.")),
    );

    await expect(
      assessWithProviderFallback(sampleAssessmentInput, {
        assessWithOpenAi,
        assessWithSarvam,
      }),
    ).rejects.toThrow("OpenAI is unavailable.");
  });
});
