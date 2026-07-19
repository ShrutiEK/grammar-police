import { beforeEach, describe, expect, it, vi } from "vitest";

const gemini = vi.hoisted(() => ({
  createGeminiInteraction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./gemini.client", () => ({
  createGeminiInteraction: gemini.createGeminiInteraction,
}));

import { assessMetricWithGemini } from "./gemini.picture-conversation";

const input = {
  pictureDescription: "A girl is playing football in a park.",
  turns: [
    {
      answerMode: "spoken" as const,
      audioDurationInSeconds: 4,
      isGrounded: true,
      isRelevantToFocus: true,
      kind: "scene_description" as const,
      languageWarning: false,
      prompt: "What is the girl doing?",
      responseText: "Shes playing football.",
    },
  ],
};

describe("Gemini picture conversation assessment", () => {
  beforeEach(() => {
    gemini.createGeminiInteraction.mockReset();
  });

  it("uses structured output and preserves a no-gap result", async () => {
    gemini.createGeminiInteraction.mockImplementation(
      async ({ prompt }: { prompt: string }) => {
        const metricId = prompt.match(/Metric to assess: ([a-z_]+)/u)?.[1];

        return {
          output_text: JSON.stringify({
            band: "strong",
            confidence: "high",
            correctedText: "",
            evidenceQuote: "Shes playing football.",
            evidenceTurn: "scene_description",
            findingStatus: "no_gap",
            metricId,
            nextSkill: "none",
            observation: "The answer forms a clear idea.",
            strength: "You described the action clearly.",
            unavailableReason: "",
            unmappedSkill: "",
          }),
        };
      },
    );

    const metric = await assessMetricWithGemini("grammar", input);

    expect(metric).toMatchObject({
      findingStatus: "no_gap",
      id: "grammar",
    });
    expect(gemini.createGeminiInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.5-flash",
        responseSchema: expect.objectContaining({ type: "object" }),
      }),
    );
  });

  it("rejects malformed structured output", async () => {
    gemini.createGeminiInteraction.mockResolvedValue({
      output_text: "{",
    });

    await expect(assessMetricWithGemini("grammar", input)).rejects.toThrow(
      "invalid assessment response",
    );
  });
});
