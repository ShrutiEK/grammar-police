import "server-only";

import { assessStudentEnglish } from "@/integrations/sarvam/sarvam.assessment";
import { transcribeStudentRecording } from "@/integrations/sarvam/sarvam.transcription";

import { enforceEnglishOnlyResponse } from "./english-only";
import { selectFollowUpQuestion } from "./follow-up-question";

type ConversationContextTurn = Readonly<{
  number: number;
  question: string;
  answer: string;
}>;

export type CompletedAssessment = Readonly<{
  assessment: Awaited<ReturnType<typeof assessStudentEnglish>>;
  transcript: string;
}>;

function keepFollowUpOnFocus(
  assessment: Awaited<ReturnType<typeof assessStudentEnglish>>,
  existingFocusTopic: string | null,
  fallbackQuestion: string,
  previousQuestions: ReadonlyArray<string>,
) {
  const lockedFocusTopic =
    existingFocusTopic || (assessment.isGrounded ? assessment.focusTopic : "");

  return {
    ...assessment,
    focusTopic: lockedFocusTopic,
    nextQuestion: selectFollowUpQuestion({
      modelQuestion: assessment.nextQuestion,
      focusTopic: lockedFocusTopic,
      previousQuestions,
      sceneFallbackQuestion: fallbackQuestion,
    }),
  };
}

type CompleteAssessmentInput = Readonly<{
  audioFile: File | null;
  writtenAnswer: string | null;
  pictureDescription: string;
  fallbackQuestion: string;
  currentQuestion: string;
  focusTopic: string | null;
  conversationContext: ReadonlyArray<ConversationContextTurn>;
}>;

export async function completeStudentAssessment({
  audioFile,
  writtenAnswer,
  pictureDescription,
  fallbackQuestion,
  currentQuestion,
  focusTopic,
  conversationContext,
}: CompleteAssessmentInput): Promise<CompletedAssessment> {
  const transcript = writtenAnswer?.trim()
    ? writtenAnswer.trim()
    : audioFile
      ? await transcribeStudentRecording(audioFile)
      : "";

  if (!transcript) {
    throw new Error("We could not find an answer to assess.");
  }

  const modelAssessment = await assessStudentEnglish({
    pictureDescription,
    transcript,
    currentQuestion,
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
    assessment: keepFollowUpOnFocus(assessment, focusTopic, fallbackQuestion, [
      ...conversationContext.map((turn) => turn.question),
      currentQuestion,
    ]),
    transcript,
  };
}
