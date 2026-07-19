import "server-only";

import { assessStudentEnglishWithOpenAi } from "@/integrations/openai/openai.assessment";
import { transcribeStudentRecordingWithOpenAi } from "@/integrations/openai/openai.transcription";
import { assessStudentEnglish } from "@/integrations/sarvam/sarvam.assessment";
import {
  getStudentRecordingTranscription,
  transcribeStudentRecording,
} from "@/integrations/sarvam/sarvam.transcription";

import { enforceEnglishOnlyResponse } from "./english-only";
import { selectFollowUpQuestion } from "./follow-up-question";
import type { QuestionType } from "./assessment.schema";
import {
  assessStudentEnglishWithFallback,
  transcribeStudentRecordingWithFallback,
} from "./student-answer-provider-fallback";
import type {
  ConversationContextTurn,
  StudentRecordingTranscription,
} from "./student-answer-provider.types";

export type CompletedAssessment = Readonly<{
  assessment: Awaited<ReturnType<typeof assessStudentEnglishWithFallback>>;
  transcript: string;
}>;

export type PendingTranscription = Extract<
  StudentRecordingTranscription,
  { status: "processing" }
>;

export type StudentAssessmentResult =
  CompletedAssessment | PendingTranscription;

function keepFollowUpOnFocus(
  assessment: Awaited<ReturnType<typeof assessStudentEnglishWithFallback>>,
  existingFocusTopic: string | null,
  fallbackQuestion: string,
  previousQuestions: ReadonlyArray<string>,
  hasEstablishedPersonalExperience: boolean,
) {
  const lockedFocusTopic =
    existingFocusTopic || (assessment.isGrounded ? assessment.focusTopic : "");

  return {
    ...assessment,
    focusTopic: lockedFocusTopic,
    ...selectFollowUpQuestion({
      modelQuestion: assessment.nextQuestion,
      modelQuestionType: assessment.nextQuestionType,
      focusTopic: lockedFocusTopic,
      previousQuestions,
      sceneFallbackQuestion: fallbackQuestion,
      allowVisualQuestion:
        !assessment.isGrounded || !assessment.isRelevantToFocus,
      forceConversationProgression:
        Boolean(lockedFocusTopic) &&
        assessment.isGrounded &&
        assessment.isRelevantToFocus &&
        !assessment.languageWarning,
      hasEstablishedPersonalExperience,
    }),
  };
}

type CompleteAssessmentInput = Readonly<{
  audioFile: File | null;
  audioDurationInSeconds: number | null;
  writtenAnswer: string | null;
  transcriptionJobId: string | null;
  pictureDescription: string;
  fallbackQuestion: string;
  currentQuestion: string;
  currentQuestionType: QuestionType;
  focusTopic: string | null;
  conversationContext: ReadonlyArray<ConversationContextTurn>;
  conversationMode: "picture" | "pari";
  conversationTopic: string | null;
}>;

export async function completeStudentAssessment({
  audioFile,
  audioDurationInSeconds,
  writtenAnswer,
  transcriptionJobId,
  pictureDescription,
  fallbackQuestion,
  currentQuestion,
  currentQuestionType,
  focusTopic,
  conversationContext,
  conversationMode,
  conversationTopic,
}: CompleteAssessmentInput): Promise<StudentAssessmentResult> {
  const transcription = transcriptionJobId
    ? await getStudentRecordingTranscription(transcriptionJobId)
    : audioFile
      ? await transcribeStudentRecordingWithFallback(
          audioFile,
          audioDurationInSeconds ?? undefined,
          {
            transcribeWithOpenAi: transcribeStudentRecordingWithOpenAi,
            transcribeWithSarvam: transcribeStudentRecording,
          },
        )
      : null;

  if (transcription?.status === "processing") {
    return transcription;
  }

  const transcript = writtenAnswer?.trim() || transcription?.transcript || "";

  if (!transcript) {
    throw new Error("We could not find an answer to assess.");
  }

  const modelAssessment = await assessStudentEnglishWithFallback(
    {
      pictureDescription,
      transcript,
      currentQuestion,
      currentQuestionType,
      focusTopic,
      conversationContext,
      conversationMode,
      conversationTopic,
    },
    {
      assessWithOpenAi: assessStudentEnglishWithOpenAi,
      assessWithSarvam: assessStudentEnglish,
    },
  );
  const assessment = enforceEnglishOnlyResponse({
    assessment: modelAssessment,
    transcript,
    existingFocusTopic: focusTopic,
    fallbackQuestion,
  });

  return {
    assessment: keepFollowUpOnFocus(
      assessment,
      conversationMode === "pari" ? conversationTopic : focusTopic,
      fallbackQuestion,
      [...conversationContext.map((turn) => turn.question), currentQuestion],
      conversationContext.some(
        (turn) => turn.questionType === "personal_follow_up" && turn.isValid,
      ) ||
        (currentQuestionType === "personal_follow_up" &&
          assessment.isGrounded &&
          assessment.isRelevantToFocus &&
          !assessment.languageWarning),
    ),
    transcript,
  };
}
