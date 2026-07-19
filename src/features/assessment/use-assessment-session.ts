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

const SESSION_STORAGE_KEY = "grammar_police_assessment_session_v2";
export const MAX_QUESTIONS = 8;
export const ASSESSMENT_CHECKPOINTS = [3, 6] as const;
const INITIAL_QUESTION = "Can you describe what you see in this picture?";

function createInitialSession(
  selectedPictureFilename: PictureFilename,
): AssessmentSession {
  return {
    selectedPictureFilename,
    focusTopic: null,
    status: "in_progress",
    questionsAndAnswers: [
      {
        number: 1,
        question: INITIAL_QUESTION,
        answer: null,
        answerMode: null,
        assessment: null,
      },
    ],
  };
}

function saveSession(session: AssessmentSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function useAssessmentSession(initialPictureFilename: PictureFilename) {
  const [session, setSession] = useState<AssessmentSession>(() =>
    createInitialSession(initialPictureFilename),
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
    ) => {
      setSession((currentSession) => {
        const questionsAndAnswers = currentSession.questionsAndAnswers.map(
          (turn, index) =>
            index === currentSession.questionsAndAnswers.length - 1
              ? {
                  ...turn,
                  answer: result.transcript,
                  answerMode,
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
          status:
            questionsAndAnswers.length >= MAX_QUESTIONS
              ? "completed"
              : currentSession.status,
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

      if (
        !currentTurn?.assessment ||
        currentSession.questionsAndAnswers.length >= MAX_QUESTIONS
      ) {
        return currentSession;
      }

      const nextSession: AssessmentSession = {
        ...currentSession,
        questionsAndAnswers: [
          ...currentSession.questionsAndAnswers,
          {
            number: currentSession.questionsAndAnswers.length + 1,
            question: currentTurn.assessment.nextQuestion,
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

  const completeSession = useCallback(() => {
    setSession((currentSession) => {
      const nextSession: AssessmentSession = {
        ...currentSession,
        status: "completed",
      };
      saveSession(nextSession);
      return nextSession;
    });
  }, []);

  const resetSession = useCallback(() => {
    const nextSession = createInitialSession(selectRandomPictureFilename());
    setSession(nextSession);
    saveSession(nextSession);
  }, []);

  return {
    session,
    recordResult,
    advanceToNextQuestion,
    completeSession,
    resetSession,
  };
}
