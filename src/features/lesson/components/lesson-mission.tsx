"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type {
  AdaptiveExercise,
  ExerciseDifficulty,
  PracticeAttempt,
} from "../adaptive-exercise.schema";
import { getStartingDifficulty } from "../adaptive-difficulty";
import { requestAdaptiveExercise } from "../lesson.client";
import type { PersonalisedLesson } from "../lesson.schema";
import {
  createInitialPracticeState,
  recordPracticeAttempt,
} from "../practice-state";

const EXERCISES_PER_MISSION = 5;

type LessonMissionProperties = Readonly<{
  lesson: PersonalisedLesson;
  isDemo: boolean;
  mockOptions: Readonly<Record<string, string>>;
  onSelectMock: (mockKey: string) => void;
}>;

export function LessonMission({
  lesson,
  isDemo,
  mockOptions,
  onSelectMock,
}: LessonMissionProperties) {
  const startingDifficulty = getStartingDifficulty(lesson.startingBand);
  const [exercise, setExercise] = useState<AdaptiveExercise | null>(null);
  const [difficulty, setDifficulty] =
    useState<ExerciseDifficulty>(startingDifficulty);
  const [practiceState, setPracticeState] = useState(() =>
    createInitialPracticeState(startingDifficulty),
  );
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const attemptCount = practiceState.attempts.length;
  const score = practiceState.attempts.filter(
    (attempt) => attempt.wasCorrect,
  ).length;
  const isComplete =
    attemptCount >= EXERCISES_PER_MISSION && wasCorrect === null;

  useEffect(() => {
    void loadExercise(startingDifficulty, []);
    // A new lesson remounts this component using its skill as the key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadExercise(
    targetDifficulty: ExerciseDifficulty,
    recentAttempts: PracticeAttempt[],
  ) {
    setIsLoading(true);
    setLessonError(null);
    setDifficulty(targetDifficulty);

    try {
      const nextExercise = await requestAdaptiveExercise({
        skill: lesson.skill,
        skillLabel: lesson.skillLabel,
        track: lesson.track,
        band: lesson.startingBand,
        learnerEvidence: lesson.learnerEvidence,
        observation: lesson.observation,
        difficulty: targetDifficulty,
        recentAttempts: recentAttempts.slice(-8),
        previousPrompts: recentAttempts
          .map((attempt) => attempt.prompt)
          .slice(-8),
      });
      setExercise(nextExercise);
      setSelectedChoice(null);
      setFeedback(null);
      setWasCorrect(null);
    } catch (error) {
      setLessonError(
        error instanceof Error
          ? error.message
          : "We could not build the next challenge. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function chooseAnswer(choiceIndex: number) {
    if (!exercise || wasCorrect !== null) return;
    const isCorrect = exercise.correctChoice === choiceIndex;
    const selectedAnswer = exercise.choices[choiceIndex];
    if (!selectedAnswer) return;
    setSelectedChoice(choiceIndex);
    setFeedback(isCorrect ? exercise.successMessage : exercise.hint);
    setWasCorrect(isCorrect);
    setPracticeState((currentState) =>
      recordPracticeAttempt(currentState, {
        exercise,
        exerciseDifficulty: difficulty,
        selectedChoice: selectedAnswer,
        wasCorrect: isCorrect,
      }),
    );
  }

  function goToNextExercise() {
    if (!exercise || wasCorrect === null) return;
    if (attemptCount < EXERCISES_PER_MISSION) {
      void loadExercise(practiceState.difficulty, practiceState.attempts);
    } else {
      setWasCorrect(null);
    }
  }

  function restartLesson() {
    setExercise(null);
    setDifficulty(startingDifficulty);
    setPracticeState(createInitialPracticeState(startingDifficulty));
    setSelectedChoice(null);
    setFeedback(null);
    setWasCorrect(null);
    void loadExercise(startingDifficulty, []);
  }

  if (isComplete) {
    const missionPassed = score >= 2;
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_12%_14%,var(--color-accent-soft)_0,transparent_26%),radial-gradient(circle_at_86%_82%,var(--color-support)_0,transparent_30%)] p-5">
        <section className="assessment-card" aria-labelledby="completion-title">
          <div className="text-6xl" aria-hidden="true">
            {missionPassed ? "🏆" : "🌱"}
          </div>
          <p className="section-eyebrow mt-5">Mission complete</p>
          <h1 className="text-4xl font-extrabold" id="completion-title">
            {missionPassed ? "Superpower unlocked!" : "Your skill is growing!"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            You solved {score} of {EXERCISES_PER_MISSION} challenges about{" "}
            {lesson.skillLabel}.
            {missionPassed
              ? " Use this skill in your next picture description."
              : " Try once more—the hints will help the pattern stick."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              className="primary-button cursor-pointer"
              onClick={restartLesson}
              type="button"
            >
              Play again
            </button>
            <Link
              className="primary-button inline-flex items-center justify-center bg-support no-underline"
              href="/assessment"
            >
              Try it while speaking
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_14%,var(--color-accent-soft)_0,transparent_25%),radial-gradient(circle_at_88%_76%,var(--color-support)_0,transparent_31%)] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="text-sm font-bold text-eyebrow hover:underline"
            href="/assessment"
          >
            ← Assessment
          </Link>
          <p className="rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-bold">
            Challenge {attemptCount + 1} of {EXERCISES_PER_MISSION} · Level{" "}
            {difficulty} · ⭐ {score}
          </p>
        </header>

        {isDemo && (
          <section
            className="rounded-xl border-2 border-dashed border-ink bg-white p-4"
            aria-label="Temporary lesson mocks"
          >
            <p className="text-sm font-bold text-ink">
              🧪 Temporary test metrics
            </p>
            <p className="mt-1 text-xs text-muted">
              Choose a weakness to rebuild the lesson. Remove this panel after
              evaluator integration.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(mockOptions).map(([mockKey, label]) => (
                <button
                  className="cursor-pointer rounded-full border-2 border-ink bg-canvas px-3 py-2 text-xs font-bold hover:bg-accent-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  key={mockKey}
                  onClick={() => onSelectMock(mockKey)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section
          className="overflow-hidden rounded-[2rem] border-[3px] border-ink bg-white shadow-card"
          aria-labelledby="mission-title"
        >
          <div className="bg-[#6c5ce7] px-6 py-6 text-white sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] uppercase">
              Your highest-impact mission
            </p>
            <h1 className="mt-2 text-4xl font-extrabold" id="mission-title">
              {lesson.missionTitle}
            </h1>
            <p className="mt-2 text-white/90">
              Today’s one skill: {lesson.skillLabel}
            </p>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <details className="rounded-2xl border-2 border-ink bg-[#f3f0ff] p-4">
              <summary className="cursor-pointer font-bold">
                Why this mission?
              </summary>
              <p className="mt-3 text-muted">{lesson.reason}</p>
              <p className="mt-2 border-l-4 border-[#6c5ce7] pl-3 text-sm italic text-muted">
                Your words: “{lesson.learnerEvidence}”
              </p>
            </details>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-ink bg-accent-soft p-4">
                <p className="text-xs font-bold uppercase">Quick power-up</p>
                <p className="mt-2 text-sm leading-relaxed">
                  {lesson.teachingTip}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-support p-4">
                <p className="text-xs font-bold uppercase">See the upgrade</p>
                <p className="mt-2 text-sm leading-relaxed">{lesson.example}</p>
              </div>
            </div>

            <div aria-live="polite">
              <p className="text-sm font-bold text-[#6c5ce7]">
                AI challenge · Difficulty {difficulty} of 5
              </p>
              {isLoading && (
                <div
                  className="mt-4 rounded-2xl border-2 border-ink bg-[#f3f0ff] p-6 text-center"
                  role="status"
                >
                  <p className="font-bold">✨ Building your next challenge…</p>
                  <p className="mt-1 text-sm text-muted">
                    The AI is creating fresh practice at level{" "}
                    {practiceState.difficulty}.
                  </p>
                </div>
              )}

              {lessonError && !isLoading && (
                <div
                  className="mt-4 rounded-2xl border-2 border-ink bg-[#ffe3e0] p-4"
                  role="alert"
                >
                  <p className="font-bold">We could not load the exercise.</p>
                  <p className="mt-1 text-sm text-muted">{lessonError}</p>
                  <button
                    className="primary-button mt-4 cursor-pointer"
                    onClick={() =>
                      loadExercise(difficulty, practiceState.attempts)
                    }
                    type="button"
                  >
                    Try again
                  </button>
                </div>
              )}

              {exercise && !isLoading && !lessonError && (
                <>
                  <h2 className="mt-1 text-2xl font-bold">{exercise.prompt}</h2>
                  <div className="mt-4 grid gap-3">
                    {exercise.choices.map((choice, choiceIndex) => {
                      const wasSelected = selectedChoice === choiceIndex;
                      return (
                        <button
                          className={`min-h-14 cursor-pointer rounded-2xl border-2 border-ink px-5 py-3 text-left font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${wasSelected ? (wasCorrect ? "bg-support" : "bg-[#ffe3e0]") : "bg-white"}`}
                          disabled={wasCorrect !== null}
                          key={choice}
                          onClick={() => chooseAnswer(choiceIndex)}
                          type="button"
                        >
                          <span className="mr-3" aria-hidden="true">
                            {String.fromCharCode(65 + choiceIndex)}.
                          </span>
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {feedback && (
                    <div
                      className={`mt-4 rounded-2xl border-2 border-ink p-4 ${wasCorrect ? "bg-support" : "bg-[#fff5dc]"}`}
                      role="status"
                    >
                      <p className="font-bold">
                        {wasCorrect ? "✅ Nice work!" : "💡 Keep this level"}
                      </p>
                      <p className="mt-1 text-sm text-muted">{feedback}</p>
                      <p className="mt-2 text-sm font-semibold">
                        {wasCorrect
                          ? `Correct—the next challenge moves to level ${practiceState.difficulty}.`
                          : `Not yet—the next challenge stays at level ${practiceState.difficulty}.`}
                      </p>
                      {wasCorrect !== null && (
                        <p className="mt-2 text-sm text-muted">
                          {exercise.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {wasCorrect !== null && (
                    <button
                      className="primary-button mt-5 w-full cursor-pointer"
                      onClick={goToNextExercise}
                      type="button"
                    >
                      {attemptCount === EXERCISES_PER_MISSION - 1
                        ? "See my result"
                        : wasCorrect
                          ? `Try level ${practiceState.difficulty} →`
                          : `More practice at level ${practiceState.difficulty} →`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
