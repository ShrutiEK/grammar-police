"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createPersonalisedLesson } from "../create-personalised-lesson";
import {
  demoLessonAssessment,
  isMockLessonKey,
  mockLessonAssessments,
  mockLessonLabels,
} from "../demo-assessment";
import { pullLessonAssessment } from "@/features/state-sync/lesson-sync";

import {
  lessonAssessmentStorageKey,
  loadLessonAssessment,
} from "../lesson-assessment-storage";
import type { PersonalisedLesson } from "../lesson.schema";
import { LessonMission } from "./lesson-mission";

export function LessonLoader() {
  const [state, setState] = useState<{
    lesson: PersonalisedLesson;
    isDemo: boolean;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadLessonTimer = window.setTimeout(async () => {
      try {
        // Prefer the sessionStorage handoff; fall back to the Redis mirror when
        // it is missing (e.g. a fresh tab or a lost sessionStorage).
        const savedAssessment =
          loadLessonAssessment() ?? (await pullLessonAssessment());
        if (cancelled) {
          return;
        }
        const input = savedAssessment ?? demoLessonAssessment;
        const isDemo = savedAssessment === null;
        setState({ lesson: createPersonalisedLesson(input), isDemo });
      } catch {
        if (!cancelled) {
          setLoadError(
            "We couldn’t open your next challenge. Return to the conversation and try again.",
          );
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(loadLessonTimer);
    };
  }, []);

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <section className="assessment-card" role="alert">
          <h1 className="text-2xl font-bold">We could not open your lesson.</h1>
          <p className="mt-3 text-muted">{loadError}</p>
          <Link
            className="primary-button mt-6 inline-flex no-underline"
            href="/"
          >
            Return to the conversation
          </Link>
        </section>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p role="status">Building your mission…</p>
      </main>
    );
  }

  function loadMock(mockKey: string) {
    if (!isMockLessonKey(mockKey)) return;
    sessionStorage.removeItem(lessonAssessmentStorageKey);
    setState({
      lesson: createPersonalisedLesson(mockLessonAssessments[mockKey]),
      isDemo: true,
    });
  }

  return (
    <LessonMission
      isDemo={state.isDemo}
      key={state.lesson.skill}
      lesson={state.lesson}
      mockOptions={mockLessonLabels}
      onSelectMock={loadMock}
    />
  );
}
