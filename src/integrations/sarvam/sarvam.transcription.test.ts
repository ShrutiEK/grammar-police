import { afterEach, describe, expect, it, vi } from "vitest";

const sarvam = vi.hoisted(() => ({
  requestSarvam: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("./sarvam.client", () => ({
  requestSarvam: sarvam.requestSarvam,
  SarvamApiError: class SarvamApiError extends Error {
    status: number;
    responseBody: string;

    constructor(status: number, responseBody: string) {
      super(
        "The assessment service is temporarily unavailable. Please try again.",
      );
      this.status = status;
      this.responseBody = responseBody;
    }
  },
}));

import {
  getStudentRecordingTranscription,
  transcribeStudentRecording,
} from "./sarvam.transcription";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

describe("Sarvam batch transcription", () => {
  afterEach(() => {
    sarvam.requestSarvam.mockReset();
    vi.unstubAllGlobals();
  });

  it("creates, uploads, and starts a batch job for a recording over 30 seconds", async () => {
    sarvam.requestSarvam
      .mockResolvedValueOnce(jsonResponse({ job_id: "job-123" }))
      .mockResolvedValueOnce(
        jsonResponse({
          upload_urls: {
            "student-recording.webm": {
              file_url: "https://storage.example.test/student-recording.webm",
            },
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ job_state: "Accepted" }));
    const uploadFetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", uploadFetch);

    const result = await transcribeStudentRecording(
      new File(["recording"], "answer.webm", { type: "audio/webm" }),
      31,
    );

    expect(result).toEqual({ jobId: "job-123", status: "processing" });
    expect(sarvam.requestSarvam).toHaveBeenNthCalledWith(
      1,
      "/speech-to-text/job/v1",
      expect.objectContaining({ method: "POST" }),
    );
    expect(sarvam.requestSarvam).toHaveBeenNthCalledWith(
      2,
      "/speech-to-text/job/v1/upload-files",
      expect.objectContaining({ method: "POST" }),
    );
    expect(sarvam.requestSarvam).toHaveBeenNthCalledWith(
      3,
      "/speech-to-text/job/v1/job-123/start",
      expect.objectContaining({ method: "POST" }),
    );
    expect(uploadFetch).toHaveBeenCalledWith(
      "https://storage.example.test/student-recording.webm",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("returns the downloaded transcript after a batch job completes", async () => {
    sarvam.requestSarvam
      .mockResolvedValueOnce(
        jsonResponse({
          job_details: [
            {
              outputs: [{ file_name: "0.json" }],
              state: "Success",
            },
          ],
          job_state: "Completed",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          download_urls: {
            "0.json": {
              file_url: "https://storage.example.test/0.json",
            },
          },
        }),
      );
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ transcript: "A clear answer." })),
    );

    await expect(getStudentRecordingTranscription("job-123")).resolves.toEqual({
      status: "completed",
      transcript: "A clear answer.",
    });
  });
});
