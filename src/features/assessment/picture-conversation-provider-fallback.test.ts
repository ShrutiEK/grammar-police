import { describe, expect, it, vi } from "vitest";

import type {
  PictureConversationAssessmentInput,
  PictureConversationMetricResult,
} from "./picture-conversation.schema";
import { assessMetricWithProviderFallback } from "./picture-conversation-provider-fallback";
import { samplePictureConversation } from "./sample-picture-conversation.data";

const input: PictureConversationAssessmentInput = {
  pictureDescription:
    "Families are having a picnic while two children fly a kite.",
  turns: samplePictureConversation.turns,
};

const metric: PictureConversationMetricResult = {
  band: "strong",
  confidence: "high",
  evidence: [
    {
      learnerText: "The children are flying a kite.",
      observation: "The sentence is clear.",
      turn: "scene_description",
    },
  ],
  findingStatus: "no_gap",
  id: "grammar",
  status: "assessed",
  strength: "You formed a clear sentence.",
};

describe("picture conversation metric provider fallback", () => {
  it("uses OpenAI when the metric is valid", async () => {
    const assessWithOpenAi = vi.fn().mockResolvedValue(metric);
    const assessWithGemini = vi.fn().mockResolvedValue(metric);

    await expect(
      assessMetricWithProviderFallback("grammar", input, {
        assessWithGemini,
        assessWithOpenAi,
      }),
    ).resolves.toEqual(metric);
    expect(assessWithGemini).not.toHaveBeenCalled();
  });

  it("uses Gemini when an OpenAI metric is invalid", async () => {
    const assessWithOpenAi = vi
      .fn()
      .mockRejectedValue(new Error("Invalid article evidence."));
    const assessWithGemini = vi.fn().mockResolvedValue(metric);

    await expect(
      assessMetricWithProviderFallback("grammar", input, {
        assessWithGemini,
        assessWithOpenAi,
      }),
    ).resolves.toEqual(metric);
    expect(assessWithGemini).toHaveBeenCalledWith("grammar", input);
  });

  it("returns the Gemini error when both providers fail", async () => {
    const assessWithOpenAi = vi
      .fn()
      .mockRejectedValue(new Error("OpenAI is unavailable."));
    const assessWithGemini = vi
      .fn()
      .mockRejectedValue(new Error("Gemini is unavailable."));

    await expect(
      assessMetricWithProviderFallback("grammar", input, {
        assessWithGemini,
        assessWithOpenAi,
      }),
    ).rejects.toThrow("Gemini is unavailable.");
  });
});
