import { beforeEach, describe, expect, it, vi } from "vitest";

const openAi = vi.hoisted(() => ({
  requestOpenAi: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./openai.client", () => ({
  requestOpenAi: openAi.requestOpenAi,
}));

import { assessMetricWithOpenAi } from "./openai.picture-conversation";

const input = {
  pictureDescription: "A girl is playing football.",
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

describe("OpenAI picture conversation assessment", () => {
  beforeEach(() => {
    openAi.requestOpenAi.mockReset();
  });

  it("uses the current high-quality model with strict structured output", async () => {
    openAi.requestOpenAi.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: {
                content: JSON.stringify({
                  band: "strong",
                  confidence: "high",
                  correctedText: "",
                  evidenceQuote: "Shes playing football.",
                  evidenceTurn: "scene_description",
                  findingStatus: "no_gap",
                  metricId: "grammar",
                  nextSkill: "none",
                  observation: "The answer forms a clear idea.",
                  strength: "You described the action clearly.",
                  unavailableReason: "",
                  unmappedSkill: "",
                }),
              },
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      assessMetricWithOpenAi("grammar", input),
    ).resolves.toMatchObject({
      findingStatus: "no_gap",
      id: "grammar",
    });
    const request = openAi.requestOpenAi.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body)) as {
      model: string;
      response_format: { json_schema: { strict: boolean } };
    };

    expect(body.model).toBe("gpt-5.6-sol");
    expect(body.response_format.json_schema.strict).toBe(true);
  });
});
