import type { LearnerAssessment } from "../assessment.schema";

export type AssessmentCtaAction = "continue" | "feedback";

type AssessmentResultsProperties = Readonly<{
  assessment: LearnerAssessment;
  isCheckpoint: boolean;
  isFinalQuestion: boolean;
  pendingAction: AssessmentCtaAction | null;
  onContinue: () => void;
  onShowFeedback: () => void;
}>;

export function AssessmentResults({
  assessment,
  isCheckpoint,
  isFinalQuestion,
  pendingAction,
  onContinue,
  onShowFeedback,
}: AssessmentResultsProperties) {
  const isBusy = pendingAction !== null;
  const progressMessage =
    pendingAction === "feedback"
      ? "Looking across your conversation and preparing your feedback…"
      : pendingAction === "continue"
        ? "Getting your next question ready…"
        : null;

  return (
    <section
      aria-busy={isBusy}
      className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[5px_5px_0_#17213d] sm:rounded-3xl sm:p-5"
    >
      {assessment.languageWarning && (
        <p
          className="rounded-xl border-2 border-[#b96a00] bg-[#fff5dc] p-3 text-sm font-semibold text-ink"
          role="alert"
        >
          {assessment.languageHint ||
            "Please answer in English so we can understand your conversation."}
        </p>
      )}

      <div className={assessment.languageWarning ? "mt-4" : ""}>
        {isFinalQuestion ? (
          <button
            className="primary-button w-full cursor-pointer bg-support"
            disabled={isBusy}
            onClick={onShowFeedback}
            type="button"
          >
            See my conversation feedback →
          </button>
        ) : isCheckpoint ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              className="primary-button w-full cursor-pointer bg-support"
              disabled={isBusy}
              onClick={onContinue}
              type="button"
            >
              Keep talking →
            </button>
            <button
              className="primary-button w-full cursor-pointer"
              disabled={isBusy}
              onClick={onShowFeedback}
              type="button"
            >
              See my feedback →
            </button>
          </div>
        ) : (
          <button
            className="primary-button w-full cursor-pointer"
            disabled={isBusy}
            onClick={onContinue}
            type="button"
          >
            Continue conversation →
          </button>
        )}

        {progressMessage && (
          <p
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-center text-sm font-semibold text-ink"
            role="status"
          >
            <span
              aria-hidden="true"
              className="inline-block size-2 animate-pulse rounded-full bg-eyebrow"
            />
            {progressMessage}
          </p>
        )}
      </div>
    </section>
  );
}
