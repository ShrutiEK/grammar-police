"use client";

import { useCallback, useEffect, useState } from "react";

import { selectRandomPictureFilename } from "@/features/picture-prompt/picture-prompt.data";
import type { PictureFilename } from "@/picture-descriptions/picture-descriptions.data";

import type { AssessmentResult } from "./assessment-response.schema";
import {
  assessmentSessionSchema,
  type AssessmentSession,
  type ConversationTurn,
} from "./assessment-session.schema";
import {
  createInitialAssessmentSession,
  createSwitchedPictureSession,
} from "./assessment-session";

const SESSION_STORAGE_KEY = "grammar_police_assessment_session_v2";
export const MAX_QUESTIONS = 8;
export const ASSESSMENT_CHECKPOINTS = [3, 6] as const;
function saveSession(session: AssessmentSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function useAssessmentSession(initialPictureFilename: PictureFilename) {
  const [session, setSession] = useState<AssessmentSession>(() =>
    createInitialAssessmentSession(initialPictureFilename),
  );

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!savedSession) {
      return;
    }

    try {
      const parsedSession = assessmentSessionSchema.safeParse(
        JSON.parse(savedSession) as unknown,
      );

      if (parsedSession.success) {
        const restoreSessionTimer = window.setTimeout(() => {
          setSession(parsedSession.data);
        }, 0);

        return () => window.clearTimeout(restoreSessionTimer);
      }
    } catch {
      // The invalid stored session is removed below.
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const recordResult = useCallback(
    (
      result: AssessmentResult,
      answerMode: NonNullable<ConversationTurn["answerMode"]>,
      audioDurationInSeconds: number | null = null,
    ) => {
      setSession((currentSession) => {
        const questionsAndAnswers = currentSession.questionsAndAnswers.map(
          (turn, index) =>
            index === currentSession.questionsAndAnswers.length - 1
              ? {
                  ...turn,
                  answer: result.transcript,
                  answerMode,
                  audioDurationInSeconds:
                    answerMode === "spoken" ? audioDurationInSeconds : null,
                  assessment: result.assessment,
                }
              : turn,
        );
        const nextSession: AssessmentSession = {
          ...currentSession,
          focusTopic:
            currentSession.focusTopic ||
            (result.assessment.isGrounded
              ? result.assessment.focusTopic || null
              : null),
          questionsAndAnswers,
        };
        saveSession(nextSession);
        return nextSession;
      });
    },
    [],
  );

  const advanceToNextQuestion = useCallback(() => {
    setSession((currentSession) => {
      const currentTurn = currentSession.questionsAndAnswers.at(-1);

      if (!currentTurn?.assessment || currentTurn.number >= MAX_QUESTIONS) {
        return currentSession;
      }

      const nextSession: AssessmentSession = {
        ...currentSession,
        questionsAndAnswers: [
          ...currentSession.questionsAndAnswers,
          {
            number: currentTurn.number + 1,
            question: currentTurn.assessment.nextQuestion,
            questionType: currentTurn.assessment.nextQuestionType,
            answer: null,
            answerMode: null,
            assessment: null,
          },
        ],
      };
      saveSession(nextSession);
      return nextSession;
    });
  }, []);

  const switchPicture = useCallback(() => {
    setSession((currentSession) => {
      const currentTurn = currentSession.questionsAndAnswers.at(-1);

      if (!currentTurn) {
        return currentSession;
      }

      const viewedPictures = currentSession.viewedPictureFilenames ?? [
        ...(currentSession.previousPictureSessions ?? []).map(
          (pictureSession) => pictureSession.selectedPictureFilename,
        ),
        currentSession.selectedPictureFilename,
      ];

      if (new Set(viewedPictures).size >= 5) {
        return currentSession;
      }

      const nextSession = createSwitchedPictureSession(
        currentSession,
        selectRandomPictureFilename(viewedPictures),
      );

      saveSession(nextSession);
      return nextSession;
    });
  }, []);

  const resetSession = useCallback(() => {
    setSession((currentSession) => {
      const nextSession = createInitialAssessmentSession(
        selectRandomPictureFilename([currentSession.selectedPictureFilename]),
      );
      saveSession(nextSession);
      return nextSession;
    });
  }, []);

  return {
    session,
    recordResult,
    advanceToNextQuestion,
    switchPicture,
    resetSession,
  };
}
