import type { AssessmentSession } from "./assessment-session.schema";
import type { PictureConversationInput } from "./picture-conversation.schema";

export function createPictureConversationInput(
  session: AssessmentSession,
): PictureConversationInput {
  return {
    pictureFilename: session.selectedPictureFilename,
    turns: session.questionsAndAnswers.flatMap((turn, index) => {
      if (!turn.answer || !turn.answerMode || !turn.assessment) {
        return [];
      }

      return {
        answerMode: turn.answerMode,
        ...(turn.answerMode === "spoken" && turn.audioDurationInSeconds
          ? { audioDurationInSeconds: turn.audioDurationInSeconds }
          : {}),
        isGrounded: turn.assessment.isGrounded,
        isRelevantToFocus: turn.assessment.isRelevantToFocus,
        kind:
          index === 0 ? "scene_description" : (turn.questionType ?? "unknown"),
        languageWarning: turn.assessment.languageWarning,
        prompt: turn.question,
        responseText: turn.answer,
      };
    }),
  };
}
