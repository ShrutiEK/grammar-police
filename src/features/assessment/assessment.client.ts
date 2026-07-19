import { z } from "zod";

import type { PictureFilename } from "@/picture-descriptions/picture-descriptions.data";

import {
  completedAssessmentResponseSchema,
  type AssessmentResult,
} from "./assessment-response.schema";

const assessmentErrorResponseSchema = z.object({
  error: z.string().trim().min(1),
});

type ConversationContextTurn = Readonly<{
  number: number;
  question: string;
  answer: string;
}>;

type RequestAssessmentInput = Readonly<{
  audioBlob?: Blob;
  writtenAnswer?: string;
  pictureFilename: PictureFilename;
  currentQuestion: string;
  focusTopic: string | null;
  conversationContext: ReadonlyArray<ConversationContextTurn>;
}>;

export async function requestStudentAssessment({
  audioBlob,
  writtenAnswer,
  pictureFilename,
  currentQuestion,
  focusTopic,
  conversationContext,
}: RequestAssessmentInput): Promise<AssessmentResult> {
  const formData = new FormData();

  if (audioBlob) {
    formData.append("audio", audioBlob, "student-recording.webm");
  }

  if (writtenAnswer?.trim()) {
    formData.append("writtenAnswer", writtenAnswer.trim());
  }

  formData.append("pictureFilename", pictureFilename);
  formData.append("currentQuestion", currentQuestion);
  formData.append("focusTopic", focusTopic ?? "");
  formData.append("conversationContext", JSON.stringify(conversationContext));

  const response = await fetch("/api/assessment", {
    body: formData,
    method: "POST",
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const errorResponse = assessmentErrorResponseSchema.safeParse(responseBody);
    throw new Error(
      errorResponse.success
        ? errorResponse.data.error
        : "We could not assess that answer. Please try again.",
    );
  }

  return completedAssessmentResponseSchema.parse(responseBody);
}
