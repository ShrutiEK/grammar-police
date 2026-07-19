import { MAX_QUESTIONS } from "../use-assessment-session";

type ConversationTrailProperties = Readonly<{
  currentQuestionNumber: number;
  mode?: "picture" | "pari";
}>;

export function ConversationTrail({
  currentQuestionNumber,
  mode = "picture",
}: ConversationTrailProperties) {
  return (
    <nav
      aria-label={`Conversation progress: prompt ${currentQuestionNumber} of ${MAX_QUESTIONS}`}
      className="conversation-trail"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">Conversation trail</p>
        <p className="text-sm font-bold text-muted">
          {currentQuestionNumber} of {MAX_QUESTIONS}
        </p>
      </div>
      <ol className="mt-2 flex items-center" aria-hidden="true">
        {Array.from({ length: MAX_QUESTIONS }, (_, index) => {
          const questionNumber = index + 1;
          const isComplete = questionNumber < currentQuestionNumber;
          const isCurrent = questionNumber === currentQuestionNumber;

          return (
            <li
              className="flex min-w-0 flex-1 items-center last:flex-none"
              key={questionNumber}
            >
              <span
                className={`conversation-trail-dot ${
                  isComplete
                    ? "conversation-trail-dot-complete"
                    : isCurrent
                      ? "conversation-trail-dot-current"
                      : ""
                }`}
              >
                {isComplete ? "✓" : questionNumber}
              </span>
              {questionNumber < MAX_QUESTIONS && (
                <span
                  className={`conversation-trail-line ${
                    isComplete ? "conversation-trail-line-complete" : ""
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-sm text-muted">
        {currentQuestionNumber === 1
          ? mode === "pari"
            ? "Start with an idea or experience you would like to share."
            : "Start with what catches your eye."
          : currentQuestionNumber < MAX_QUESTIONS
            ? "Each answer opens a more personal question."
            : "One last answer, then your highlights are ready."}
      </p>
    </nav>
  );
}
