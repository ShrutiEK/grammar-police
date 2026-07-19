import type { ConversationTurn } from "../assessment-session.schema";

type ConversationHistoryProperties = Readonly<{
  turns: ReadonlyArray<ConversationTurn>;
}>;

export function ConversationHistory({ turns }: ConversationHistoryProperties) {
  return (
    <details className="group rounded-2xl border-2 border-ink bg-white shadow-[5px_5px_0_#17213d] sm:rounded-3xl">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-ink marker:hidden sm:px-5">
        <span>Conversation history ({turns.length})</span>
        <span
          aria-hidden="true"
          className="text-lg transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <ol className="space-y-2 border-t-2 border-ink/10 p-3 sm:p-4">
        {turns.map((turn) => (
          <li
            className="rounded-xl border border-ink/15 bg-canvas p-3"
            key={turn.number}
          >
            <p className="text-sm font-bold text-ink">
              Q{turn.number}. {turn.question}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {turn.answer ? (
                <>
                  <span className="font-bold text-ink">
                    {turn.answerMode === "spoken" ? "Spoken" : "Written"}{" "}
                    answer:
                  </span>{" "}
                  {turn.answer}
                </>
              ) : (
                "Awaiting your answer"
              )}
            </p>
          </li>
        ))}
      </ol>
    </details>
  );
}
