import "server-only";

import { z } from "zod";

import type { StudentRecordingTranscription } from "@/features/assessment/student-answer-provider.types";

import { requestOpenAi } from "./openai.client";

const transcriptionResponseSchema = z.object({
  text: z.string().trim().min(1),
});

const openAiTranscriptionModel = "gpt-4o-mini-transcribe";

function getRecordingFilename(mimeType: string) {
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") {
    return "student-recording.wav";
  }

  if (mimeType === "audio/mpeg") {
    return "student-recording.mp3";
  }

  return "student-recording.webm";
}

export async function transcribeStudentRecordingWithOpenAi(
  audioFile: File,
): Promise<StudentRecordingTranscription> {
  const mimeType = audioFile.type.split(";")[0] || "audio/webm";
  const requestBody = new FormData();

  requestBody.append(
    "file",
    new Blob([audioFile], { type: mimeType }),
    getRecordingFilename(mimeType),
  );
  requestBody.append("model", openAiTranscriptionModel);
  requestBody.append("response_format", "json");
  requestBody.append(
    "prompt",
    "Transcribe exactly what the learner says without translating. Preserve Hindi words in Devanagari and English words in Latin script, including when both languages are mixed.",
  );

  const response = await requestOpenAi("/v1/audio/transcriptions", {
    body: requestBody,
    method: "POST",
  });
  const responseBody: unknown = await response.json();

  return {
    status: "completed",
    transcript: transcriptionResponseSchema.parse(responseBody).text,
  };
}
