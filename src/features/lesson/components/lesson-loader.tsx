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
    const loadLessonTimer = window.setTimeout(() => {
      try {
        const savedAssessment = loadLessonAssessment();
        const input = savedAssessment ?? demoLessonAssessment;
        const isDemo = savedAssessment === null;
        setState({ lesson: createPersonalisedLesson(input), isDemo });
      } catch {
        setLoadError(
          "We couldn’t open your next challenge. Return to the conversation and try again.",
        );
      }
    }, 0);

    return () => window.clearTimeout(loadLessonTimer);
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
