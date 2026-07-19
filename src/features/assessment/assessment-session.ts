import type { PictureFilename } from "../../picture-descriptions/picture-descriptions.data";
import type { AssessmentSession } from "./assessment-session.schema";
import {
  getPariConversationTopic,
  type PariConversationTopicId,
} from "./pari-conversation.data";

const initialQuestion = "Can you describe what you see in this picture?";

export function createInitialAssessmentSession(
  selectedPictureFilename: PictureFilename,
  questionNumber = 1,
  previousPictureSessions: NonNullable<
    AssessmentSession["previousPictureSessions"]
  > = [],
  viewedPictureFilenames: PictureFilename[] = [selectedPictureFilename],
): AssessmentSession {
  return {
    conversationMode: "picture",
    pariTopicId: null,
    selectedPictureFilename,
    focusTopic: null,
    previousPictureSessions,
    viewedPictureFilenames,
    questionsAndAnswers: [
      {
        number: questionNumber,
        question: initialQuestion,
        questionType: "picture_follow_up",
        answer: null,
        answerMode: null,
        assessment: null,
      },
    ],
  };
}

export function createPariAssessmentSession(
  currentSession: AssessmentSession,
  topicId: PariConversationTopicId,
): AssessmentSession {
  const topic = getPariConversationTopic(topicId);

  return {
    ...currentSession,
    conversationMode: "pari",
    pariTopicId: topicId,
    focusTopic: topic.label,
    questionsAndAnswers: [
      {
        number: 1,
        question: topic.openingQuestion,
        questionType: "personal_follow_up",
        answer: null,
        answerMode: null,
        assessment: null,
      },
    ],
    previousPictureSessions: [],
    viewedPictureFilenames: [currentSession.selectedPictureFilename],
  };
}

export function createSwitchedPictureSession(
  currentSession: AssessmentSession,
  nextPictureFilename: PictureFilename,
) {
  const currentTurn = currentSession.questionsAndAnswers.at(-1);

  if (!currentTurn) {
    return currentSession;
  }

  const answeredTurns = currentSession.questionsAndAnswers.filter(
    (turn) => turn.answer && turn.assessment,
  );
  const previousPictureSessions =
    answeredTurns.length > 0
      ? [
          ...(currentSession.previousPictureSessions ?? []),
          {
            selectedPictureFilename: currentSession.selectedPictureFilename,
            focusTopic: currentSession.focusTopic,
            questionsAndAnswers: answeredTurns,
          },
        ]
      : (currentSession.previousPictureSessions ?? []);
  const viewedPictureFilenames = [
    ...new Set([
      ...(currentSession.viewedPictureFilenames ?? [
        currentSession.selectedPictureFilename,
      ]),
      nextPictureFilename,
    ]),
  ];

  return createInitialAssessmentSession(
    nextPictureFilename,
    currentTurn.answer && currentTurn.assessment
      ? currentTurn.number + 1
      : currentTurn.number,
    previousPictureSessions,
    viewedPictureFilenames,
  );
}
