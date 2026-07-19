import { afterEach, describe, expect, it, vi } from "vitest";

import { requestPictureConversationFeedback } from "./picture-conversation.client";
import type {
  PictureConversationInput,
  PictureConversationStreamEvent,
} from "./picture-conversation.schema";

const input: PictureConversationInput = {
  pictureFilename: "picnic.png",
  turns: [
    {
      answerMode: "written",
      isGrounded: true,
      isRelevantToFocus: true,
      kind: "scene_description",
      languageWarning: false,
      prompt: "What can you see?",
      responseText: "A family is having a picnic.",
    },
  ],
};

function createStreamResponse(events: PictureConversationStreamEvent[]) {
  return new Response(
    events.map((event) => `${JSON.stringify(event)}\n`).join(""),
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("picture conversation feedback client", () => {
  it("reports streamed metric progress before returning the final response", async () => {
    const progress = [
      {
        completedMetricIds: [],
        stage: "reading" as const,
        totalMetrics: 0,
      },
      {
        completedMetricIds: ["grammar" as const, "vocabulary" as const],
        stage: "calculating" as const,
        totalMetrics: 6,
      },
      {
        completedMetricIds: ["grammar" as const, "vocabulary" as const],
        stage: "summarizing" as const,
        totalMetrics: 6,
      },
    ];
    const response = {
      message: "Please try again.",
      status: "retry_later" as const,
    };
    const onProgress = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createStreamResponse([
          ...progress.map((progressEvent): PictureConversationStreamEvent => ({
            progress: progressEvent,
            type: "progress",
          })),
          { response, type: "result" },
        ]),
      ),
    );

    await expect(
      requestPictureConversationFeedback(input, { onProgress }),
    ).resolves.toEqual(response);
    expect(onProgress.mock.calls.map(([event]) => event)).toEqual(progress);
  });
});
