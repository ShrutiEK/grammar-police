import "server-only";

import { assessStudentEnglish } from "@/integrations/sarvam/sarvam.assessment";
import {
  getStudentRecordingTranscription,
  transcribeStudentRecording,
  type StudentRecordingTranscription,
} from "@/integrations/sarvam/sarvam.transcription";

import { enforceEnglishOnlyResponse } from "./english-only";
import { selectFollowUpQuestion } from "./follow-up-question";
import type { QuestionType } from "./assessment.schema";

type ConversationContextTurn = Readonly<{
  number: number;
  question: string;
  answer: string;
  questionType: QuestionType;
  isValid: boolean;
}>;

export type CompletedAssessment = Readonly<{
  assessment: Awaited<ReturnType<typeof assessStudentEnglish>>;
  transcript: string;
}>;

export type PendingTranscription = Extract<
  StudentRecordingTranscription,
  { status: "processing" }
>;

export type StudentAssessmentResult =
  CompletedAssessment | PendingTranscription;

function keepFollowUpOnFocus(
  assessment: Awaited<ReturnType<typeof assessStudentEnglish>>,
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
}: CompleteAssessmentInput): Promise<StudentAssessmentResult> {
  const transcription = transcriptionJobId
    ? await getStudentRecordingTranscription(transcriptionJobId)
    : audioFile
      ? await transcribeStudentRecording(
          audioFile,
          audioDurationInSeconds ?? undefined,
        )
      : null;

  if (transcription?.status === "processing") {
    return transcription;
  }

  const transcript = writtenAnswer?.trim() || transcription?.transcript || "";

  if (!transcript) {
    throw new Error("We could not find an answer to assess.");
  }

  const modelAssessment = await assessStudentEnglish({
    pictureDescription,
    transcript,
    currentQuestion,
    currentQuestionType,
    focusTopic,
    conversationContext,
  });
  const assessment = enforceEnglishOnlyResponse({
    assessment: modelAssessment,
    transcript,
    existingFocusTopic: focusTopic,
    fallbackQuestion,
  });

  return {
    assessment: keepFollowUpOnFocus(
      assessment,
      focusTopic,
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
