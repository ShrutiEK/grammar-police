import type { LearnerAssessment } from "../assessment.schema";

export type AssessmentCtaAction = "change-picture" | "continue" | "feedback";

type AssessmentResultsProperties = Readonly<{
  assessment: LearnerAssessment;
  canChangePicture: boolean;
  isCheckpoint: boolean;
  isFinalQuestion: boolean;
  pendingAction: AssessmentCtaAction | null;
  onContinue: () => void;
  onChangePicture: () => void;
  onShowFeedback: () => void;
  conversationMode?: "picture" | "pari";
}>;

export function AssessmentResults({
  assessment,
  canChangePicture,
  isCheckpoint,
  isFinalQuestion,
  pendingAction,
  onContinue,
  onChangePicture,
  onShowFeedback,
  conversationMode = "picture",
}: AssessmentResultsProperties) {
  const isBusy = pendingAction !== null;
  const hasActions = isFinalQuestion || isCheckpoint;

  if (!assessment.languageWarning && !hasActions) {
    return null;
  }

  const progressMessage =
    pendingAction === "feedback"
      ? "Looking across your conversation and preparing your feedback…"
      : pendingAction === "change-picture"
        ? "Saving this conversation and choosing a new picture…"
        : pendingAction === "continue"
          ? "Getting your next question ready…"
          : null;

  return (
    <section
      aria-busy={isBusy}
      className="rounded-2xl border-2 border-ink bg-surface p-4 shadow-[5px_5px_0_#17213d] sm:rounded-3xl sm:p-5"
    >
      {assessment.languageWarning && (
        <p
          className="rounded-xl border-2 border-eyebrow bg-accent-soft p-3 text-base font-semibold text-ink"
          role="alert"
        >
          {assessment.languageHint ||
            "Please answer in English so we can understand your conversation."}
        </p>
      )}

      {hasActions && (
        <div className={assessment.languageWarning ? "mt-4" : ""}>
          {isFinalQuestion ? (
            <button
              className="primary-button w-full cursor-pointer bg-support text-ink"
              disabled={isBusy}
              onClick={onShowFeedback}
              type="button"
            >
              See my conversation feedback →
            </button>
          ) : (
            <div
              className={`grid gap-2.5 ${canChangePicture ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
            >
              <button
                className="primary-button w-full cursor-pointer bg-support text-ink"
                disabled={isBusy}
                onClick={onContinue}
                type="button"
              >
                Keep talking →
              </button>
              {canChangePicture && conversationMode === "picture" && (
                <button
                  className="primary-button w-full cursor-pointer bg-surface text-ink"
                  disabled={isBusy}
                  onClick={onChangePicture}
                  type="button"
                >
                  Change picture →
                </button>
              )}
              <button
                className="primary-button w-full cursor-pointer"
                disabled={isBusy}
                onClick={onShowFeedback}
                type="button"
              >
                See my feedback →
              </button>
            </div>
          )}

          {progressMessage && (
            <p
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-center text-base font-semibold text-ink"
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
      )}
    </section>
  );
}
