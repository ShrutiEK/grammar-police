"use client";

import { useCallback, useEffect, useState } from "react";

import type { AssessmentResult } from "./assessment-response.schema";
import {
  assessmentSessionSchema,
  type AssessmentSession,
} from "./assessment-session.schema";

const SESSION_STORAGE_KEY = "speak2learn_session";
const PROGRESS_PER_PICTURE = 20;

const initialSession: AssessmentSession = {
  progress: 0,
  stars: 0,
  lastResult: null,
};

function saveSession(session: AssessmentSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function useAssessmentSession() {
  const [session, setSession] = useState<AssessmentSession>(initialSession);

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
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const recordResult = useCallback((result: AssessmentResult) => {
    setSession((currentSession) => {
      const nextSession = {
        ...currentSession,
        stars: currentSession.stars + 1,
        lastResult: result,
      };
      saveSession(nextSession);
      return nextSession;
    });
  }, []);

  const advanceToNextPicture = useCallback(() => {
    setSession((currentSession) => {
      const nextSession = {
        ...currentSession,
        progress: currentSession.progress + PROGRESS_PER_PICTURE,
        lastResult: null,
      };
      saveSession(nextSession);
      return nextSession;
    });
  }, []);

  const resetSession = useCallback(() => {
    setSession(initialSession);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  return { session, recordResult, advanceToNextPicture, resetSession };
}
