import { z } from "zod";

import type { PictureFilename } from "@/picture-descriptions/picture-descriptions.data";

import type { QuestionType } from "./assessment.schema";
import {
  studentAssessmentResponseSchema,
  type AssessmentResult,
  type PendingTranscriptionResult,
} from "./assessment-response.schema";

const assessmentErrorResponseSchema = z.object({
  error: z.string().trim().min(1),
});

type ConversationContextTurn = Readonly<{
  number: number;
  question: string;
  answer: string;
  questionType: QuestionType;
  isValid: boolean;
}>;

type RequestAssessmentInput = Readonly<{
  conversationMode: "picture" | "pari";
  conversationTopic?: string;
  audioBlob?: Blob;
  audioDurationInSeconds?: number;
  transcriptionJobId?: string;
  writtenAnswer?: string;
  pictureFilename: PictureFilename;
  currentQuestion: string;
  currentQuestionType: QuestionType;
  focusTopic: string | null;
  conversationContext: ReadonlyArray<ConversationContextTurn>;
}>;

const batchPollIntervalInMilliseconds = 3_000;
const maximumBatchPollAttempts = 200;

function waitForBatchPoll() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, batchPollIntervalInMilliseconds);
  });
}

async function requestAssessmentOnce({
  audioBlob,
  audioDurationInSeconds,
  transcriptionJobId,
  writtenAnswer,
  pictureFilename,
  currentQuestion,
  currentQuestionType,
  focusTopic,
  conversationContext,
  conversationMode,
  conversationTopic,
}: RequestAssessmentInput): Promise<
  AssessmentResult | PendingTranscriptionResult
> {
  const formData = new FormData();

  if (audioBlob) {
    formData.append("audio", audioBlob, "student-recording.webm");
  }

  if (audioDurationInSeconds) {
    formData.append("audioDurationInSeconds", String(audioDurationInSeconds));
  }

  if (transcriptionJobId) {
    formData.append("transcriptionJobId", transcriptionJobId);
  }

  if (writtenAnswer?.trim()) {
    formData.append("writtenAnswer", writtenAnswer.trim());
  }

  formData.append("pictureFilename", pictureFilename);
  formData.append("conversationMode", conversationMode);
  formData.append("conversationTopic", conversationTopic ?? "");
  formData.append("currentQuestion", currentQuestion);
  formData.append("currentQuestionType", currentQuestionType);
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
        : "We couldn’t check that answer. Try sharing it again.",
    );
  }

  return studentAssessmentResponseSchema.parse(responseBody);
}

type RequestAssessmentOptions = Readonly<{
  onBatchTranscriptionPending?: () => void;
}>;

function isPendingTranscription(
  response: AssessmentResult | PendingTranscriptionResult,
): response is PendingTranscriptionResult {
  return "status" in response && response.status === "processing";
}

export async function requestStudentAssessment(
  requestInput: RequestAssessmentInput,
  { onBatchTranscriptionPending }: RequestAssessmentOptions = {},
): Promise<AssessmentResult> {
  let response = await requestAssessmentOnce(requestInput);
  let pollAttempts = 0;

  while (isPendingTranscription(response)) {
    onBatchTranscriptionPending?.();
    pollAttempts += 1;

    if (pollAttempts > maximumBatchPollAttempts) {
      throw new Error(
        "Your recording is still being transcribed. Please try again in a moment.",
      );
    }

    await waitForBatchPoll();
    response = await requestAssessmentOnce({
      ...requestInput,
      audioBlob: undefined,
      transcriptionJobId: response.jobId,
    });
  }

  if (isPendingTranscription(response)) {
    throw new Error("Your recording is still being transcribed.");
  }

  return response;
}
