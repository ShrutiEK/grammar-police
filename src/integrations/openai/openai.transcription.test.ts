import { beforeEach, describe, expect, it, vi } from "vitest";

const openAi = vi.hoisted(() => ({
  requestOpenAi: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("./openai.client", () => ({
  requestOpenAi: openAi.requestOpenAi,
}));

import { transcribeStudentRecordingWithOpenAi } from "./openai.transcription";

describe("OpenAI transcription fallback", () => {
  beforeEach(() => {
    openAi.requestOpenAi.mockReset();
  });

  it("submits WebM audio for transcription without forcing a language", async () => {
    openAi.requestOpenAi.mockImplementationOnce(
      async (_path: string, init: RequestInit) => {
        const body = init.body as FormData;

        expect(body.get("model")).toBe("gpt-4o-mini-transcribe");
        expect(body.get("response_format")).toBe("json");
        expect(body.get("language")).toBeNull();
        expect(body.get("prompt")).toContain("without translating");

        return new Response(JSON.stringify({ text: "यह a park है।" }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    );

    await expect(
      transcribeStudentRecordingWithOpenAi(
        new File(["audio"], "answer.webm", { type: "audio/webm;codecs=opus" }),
      ),
    ).resolves.toEqual({
      status: "completed",
      transcript: "यह a park है।",
    });
  });
});
