import { z } from "zod";

import {
  completedAssessmentResponseSchema,
  type AssessmentResult,
} from "./assessment-response.schema";

const assessmentErrorResponseSchema = z.object({
  error: z.string().trim().min(1),
});

type RequestAssessmentInput = Readonly<{
  audioBlob: Blob;
  pictureDescription: string;
}>;

export async function requestStudentAssessment({
  audioBlob,
  pictureDescription,
}: RequestAssessmentInput): Promise<AssessmentResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "student-recording.webm");
  formData.append("pictureDescription", pictureDescription);

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
        : "We could not assess that recording. Please try again.",
    );
  }

  return completedAssessmentResponseSchema.parse(responseBody);
}
