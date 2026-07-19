import Link from "next/link";

import type { PicturePrompt } from "@/features/picture-prompt/picture-prompt.data";

import type { AssessmentSession } from "../assessment-session.schema";
import { calculateCumulativeScores } from "../cumulative-assessment";
import { ConversationHistory } from "./conversation-history";

type AssessmentCompletionProperties = Readonly<{
  prompt: PicturePrompt;
  session: AssessmentSession;
  onReset: () => void;
}>;

const scoreLabels = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reasoning: "Reasoning",
  sentenceComplexity: "Sentence Complexity",
  communication: "Communication",
} as const;

export function AssessmentCompletion({
  prompt,
  session,
  onReset,
}: AssessmentCompletionProperties) {
  const cumulativeScores = calculateCumulativeScores(
    session.questionsAndAnswers,
  );
  const answeredCount = session.questionsAndAnswers.filter(
    (turn) => turn.answer !== null,
  ).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,var(--color-accent-soft)_0,transparent_24%),radial-gradient(circle_at_88%_78%,var(--color-support)_0,transparent_29%)] px-3 py-4 sm:px-5 sm:py-6">
      <section className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border-2 border-ink bg-white p-5 text-center shadow-[5px_5px_0_#17213d] sm:rounded-3xl sm:p-7">
          <p className="section-eyebrow mb-2 text-xs">
            Final communication assessment
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Picture conversation complete
          </h1>
          <p className="mt-3 text-muted">
            You answered {answeredCount} question
            {answeredCount === 1 ? "" : "s"} about {prompt.title.toLowerCase()}.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {Object.entries(scoreLabels).map(([key, label]) => {
              const score = cumulativeScores[key as keyof typeof scoreLabels];

              return (
                <div
                  className="rounded-xl border-2 border-ink bg-canvas p-3 shadow-[2px_2px_0_#17213d]"
                  key={key}
                >
                  <p className="text-xs font-bold text-muted uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-ink">
                    {score === null ? "—" : `${score.toFixed(1)}/5`}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              className="primary-button w-full cursor-pointer sm:w-auto"
              onClick={onReset}
              type="button"
            >
              Start a new assessment
            </button>
            <Link
              className="primary-button inline-flex w-full cursor-pointer items-center justify-center bg-support no-underline hover:bg-[#a6dccc] sm:w-auto"
              href="/"
            >
              Back to home
            </Link>
          </div>
        </div>

        <ConversationHistory turns={session.questionsAndAnswers} />
      </section>
    </main>
  );
}
