"use client";

import { useCallback, useEffect, useState } from "react";

import { selectRandomPictureFilename } from "@/features/picture-prompt/picture-prompt.data";
import { createHybridStore } from "@/features/state-sync/hybrid-store";
import { STATE_ENDPOINTS } from "@/features/state-sync/sync-transport";
import type { PictureFilename } from "@/picture-descriptions/picture-descriptions.data";

import type { AssessmentResult } from "./assessment-response.schema";
import {
  assessmentSessionSchema,
  type AssessmentSession,
  type ConversationTurn,
} from "./assessment-session.schema";
import {
  createInitialAssessmentSession,
  createPariAssessmentSession,
  createSwitchedPictureSession,
} from "./assessment-session";
import type { PariConversationTopicId } from "./pari-conversation.data";

const SESSION_STORAGE_KEY = "grammar_police_assessment_session_v2";
export const MAX_QUESTIONS = 8;
export const ASSESSMENT_CHECKPOINTS = [3, 6] as const;

// Hybrid store: localStorage stays the instant local mirror; the in-progress
// session is written through to Redis (the source of truth) on every change.
const sessionStore = createHybridStore({
  localKey: SESSION_STORAGE_KEY,
  schema: assessmentSessionSchema,
  endpoint: STATE_ENDPOINTS.session,
});

function saveSession(session: AssessmentSession) {
  sessionStore.writeLocal(session);
}

export function useAssessmentSession(initialPictureFilename: PictureFilename) {
  const [session, setSession] = useState<AssessmentSession>(() =>
    createInitialAssessmentSession(initialPictureFilename),
  );

  useEffect(() => {
    let cancelled = false;
    let remoteApplied = false;

    // 1. Restore the local mirror instantly (no UX regression). readLocal also
    //    clears any corrupt stored session.
    const local = sessionStore.readLocal();
    const restoreSessionTimer = local
      ? window.setTimeout(() => {
          if (!remoteApplied) {
            setSession(local.data);
          }
        }, 0)
      : undefined;

    // 2. Reconcile with Redis (last-write-wins). An answer recorded while the
    //    pull is in flight bumps the local sidecar, so remote can't clobber it.
    void sessionStore.pull().then((remote) => {
      if (cancelled || !remote) {
        return;
      }
      const localNow = sessionStore.readLocal();
      if (!localNow || remote.updatedAt > localNow.updatedAt) {
        remoteApplied = true;
        sessionStore.acceptRemote(remote);
        setSession(remote.data);
      } else if (localNow.updatedAt > remote.updatedAt) {
        void sessionStore.flushDirty();
      }
    });

    // 3. Flush any writes made offline once connectivity returns.
    const stopOnlineFlush = sessionStore.registerOnlineFlush();

    return () => {
      cancelled = true;
      if (restoreSessionTimer !== undefined) {
        window.clearTimeout(restoreSessionTimer);
      }
      stopOnlineFlush();
    };
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

  const startPariConversation = useCallback(
    (topicId: PariConversationTopicId) => {
      setSession((currentSession) => {
        const nextSession = createPariAssessmentSession(
          currentSession,
          topicId,
        );
        saveSession(nextSession);
        return nextSession;
      });
    },
    [],
  );

  const returnToPictureConversation = useCallback(() => {
    setSession((currentSession) => {
      const nextSession = createInitialAssessmentSession(
        currentSession.selectedPictureFilename,
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
    startPariConversation,
    returnToPictureConversation,
    resetSession,
  };
}
