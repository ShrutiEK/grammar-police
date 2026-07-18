import "server-only";

import { z } from "zod";

import { requestSarvam } from "./sarvam.client";

const transcriptionResponseSchema = z.object({
  transcript: z.string(),
});

export async function transcribeStudentRecording(audioFile: File) {
  const requestBody = new FormData();

  // Strip codec metadata (e.g., ";codecs=opus") to ensure Sarvam API accepts the MIME type.
  const mimeType = audioFile.type.split(";")[0] || "audio/webm";
  const cleanBlob = new Blob([audioFile], { type: mimeType });

  requestBody.append("file", cleanBlob, "recording.webm");
  requestBody.append("language_code", "en-IN");
  requestBody.append("mode", "transcribe");
  requestBody.append("model", "saaras:v3");

  const response = await requestSarvam("/speech-to-text", {
    body: requestBody,
    method: "POST",
  });
  const responseBody: unknown = await response.json();

  return transcriptionResponseSchema.parse(responseBody).transcript.trim();
}
