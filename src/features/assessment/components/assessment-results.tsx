"use client";

import { useState } from "react";

import type { AssessmentResult } from "../assessment-response.schema";
import type { CumulativeScores } from "../cumulative-assessment";

type AssessmentResultsProperties = Readonly<{
  result: AssessmentResult;
  cumulativeScores: CumulativeScores;
  completedQuestionCount: number;
  isCheckpoint: boolean;
  onContinue: () => void;
  onFinish: () => void;
}>;

const scoreCards = [
  { key: "vocabulary", label: "Vocabulary", color: "bg-[#f0fffb]" },
  { key: "grammar", label: "Grammar", color: "bg-[#eef8ff]" },
  { key: "reasoning", label: "Reasoning", color: "bg-[#fff5dc]" },
  {
    key: "sentenceComplexity",
    label: "Sentence Complexity",
    color: "bg-[#ffe3e0]",
  },
  {
    key: "communication",
    label: "Communication",
    color: "bg-accent-soft",
  },
] as const;

function formatScore(score: number | null) {
  return score === null ? "—" : `${score.toFixed(1)}/5`;
}

export function AssessmentResults({
  result,
  cumulativeScores,
  completedQuestionCount,
  isCheckpoint,
  onContinue,
  onFinish,
}: AssessmentResultsProperties) {
  const [dismissedWarningForAnswer, setDismissedWarningForAnswer] = useState<
    number | null
  >(null);
  const { assessment, transcript } = result;
  const isIncludedInScores =
    assessment.isGrounded &&
    assessment.isRelevantToFocus &&
    !assessment.languageWarning;
  const additionalQuestionCount = completedQuestionCount === 3 ? 3 : 2;
  const showWarningPopup =
    assessment.languageWarning &&
    dismissedWarningForAnswer !== completedQuestionCount;

  return (
    <section
      className="space-y-4 rounded-2xl border-2 border-ink bg-white p-4 shadow-[5px_5px_0_#17213d] sm:rounded-3xl sm:p-5"
      aria-labelledby="results-title"
    >
      {showWarningPopup && (
        <div
          aria-live="assertive"
          className="fixed inset-x-3 top-3 z-50 flex items-start gap-3 rounded-2xl border-2 border-[#b96a00] bg-[#fff5dc] p-4 text-left shadow-[6px_6px_0_#17213d] sm:inset-x-auto sm:top-5 sm:right-5 sm:w-full sm:max-w-sm"
          role="alert"
        >
          <span aria-hidden="true" className="text-xl">
            💬
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold tracking-wide text-[#7a3e00] uppercase">
              English practice reminder
            </p>
            <p className="mt-1 text-sm leading-relaxed font-semibold text-ink">
              {assessment.languageHint ||
                "Please answer in English only so we can assess your communication accurately."}
            </p>
          </div>
          <button
            aria-label="Dismiss reminder"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-ink/30 bg-white font-bold text-ink hover:bg-accent-soft"
            onClick={() => setDismissedWarningForAnswer(completedQuestionCount)}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      <header>
        <p className="section-eyebrow mb-1 text-xs">
          Assessment after {completedQuestionCount} answer
          {completedQuestionCount === 1 ? "" : "s"}
        </p>
        <h2 className="text-2xl font-bold text-ink" id="results-title">
          Communication check
        </h2>
      </header>

      <div className="rounded-xl border-2 border-support bg-[#f0fffb] p-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-bold text-muted uppercase">
            Question {completedQuestionCount + 1}
          </p>
          <p className="mt-1 text-sm font-bold text-ink sm:text-base">
            {assessment.nextQuestion}
          </p>
        </div>
        {!isCheckpoint && (
          <button
            className="primary-button mt-3 w-full shrink-0 cursor-pointer sm:mt-0 sm:w-auto"
            onClick={onContinue}
            type="button"
          >
            Answer next question →
          </button>
        )}
      </div>

      {isCheckpoint && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <button
            className="primary-button w-full cursor-pointer"
            onClick={onContinue}
            type="button"
          >
            Continue for {additionalQuestionCount} more questions
          </button>
          <button
            className="primary-button w-full cursor-pointer bg-support"
            onClick={onFinish}
            type="button"
          >
            Show final assessment
          </button>
        </div>
      )}

      <details className="group overflow-hidden rounded-xl border-2 border-ink/20 bg-white">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-bold text-ink marker:hidden hover:bg-canvas">
          <span>View assessment details</span>
          <span
            aria-hidden="true"
            className="text-lg transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </summary>

        <div className="space-y-3 border-t-2 border-ink/10 p-3">
          <div className="rounded-xl border-2 border-ink bg-[#f0fffb] p-3">
            <p className="mb-1 text-xs font-bold text-muted uppercase">
              Latest answer
            </p>
            <p className="text-sm font-medium text-ink italic sm:text-base">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {scoreCards.map(({ key, label, color }) => (
              <div
                className={`rounded-xl border-2 border-ink p-3 text-center shadow-[2px_2px_0_#17213d] ${color}`}
                key={key}
              >
                <p className="text-xs font-bold text-muted uppercase">
                  {label}
                </p>
                <p className="mt-1 text-xl font-extrabold text-ink">
                  {formatScore(cumulativeScores[key])}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border-2 border-ink bg-[#eef8ff] p-3">
            <h3 className="text-xs font-bold text-[#2980b9] uppercase">
              Feedback on your latest answer
            </h3>
            <p className="mt-2 text-sm leading-relaxed font-semibold text-ink sm:text-base">
              {assessment.feedback}
            </p>
          </div>

          {!isIncludedInScores && !assessment.languageWarning && (
            <p
              className="rounded-xl border border-[#d69a22] bg-[#fff5dc] p-3 text-sm font-semibold text-ink"
              role="status"
            >
              This answer was not included in your cumulative scores because it
              was not grounded in the picture or did not answer the current
              conversation topic.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
