import type { PictureConversationAssessment } from "../picture-conversation.schema";

type PictureConversationResultsProperties = Readonly<{
  assessment: PictureConversationAssessment;
  canContinueConversation?: boolean;
  hasSpokenAnswers: boolean;
  hasWrittenAnswers: boolean;
  nextConversationPrompt?: string;
  pictureCount?: number;
  onContinueConversation: () => void;
  onContinueLearning: () => void;
  onStartNewAssessment: () => void;
}>;

const bandLabel = {
  developing: "Growing",
  emerging: "Just starting",
  secure: "Getting steady",
  strong: "Strong",
} as const;

const metricLabel = {
  conversation: "Conversation",
  expression: "Sharing ideas",
  grammar: "Grammar",
  pronunciation: "Pronunciation",
  scene_understanding: "Understanding the picture",
  spoken_fluency: "Speaking flow",
  vocabulary: "Word choice",
  writing_conventions: "Spelling and writing",
} as const;

export function PictureConversationResults({
  assessment,
  canContinueConversation = true,
  hasSpokenAnswers,
  hasWrittenAnswers,
  nextConversationPrompt,
  pictureCount = 1,
  onContinueConversation,
  onContinueLearning,
  onStartNewAssessment,
}: PictureConversationResultsProperties) {
  const metricAppliesToConversation = (
    metric: PictureConversationAssessment["metrics"][number],
  ) => {
    if (metric.id === "pronunciation") {
      return false;
    }

    if (metric.id === "spoken_fluency") {
      return hasSpokenAnswers;
    }

    if (metric.id === "writing_conventions") {
      return hasWrittenAnswers;
    }

    return true;
  };
  const assessedMetrics = assessment.metrics.filter(
    (metric) =>
      metric.status === "assessed" && metricAppliesToConversation(metric),
  );
  const notAssessedMetrics = assessment.metrics.filter(
    (metric) =>
      metric.status === "not_assessed" && metricAppliesToConversation(metric),
  );
  const availableMetricCount = assessment.metrics.filter(
    metricAppliesToConversation,
  ).length;

  return (
    <section className="space-y-8 rounded-[2rem] border-[3px] border-ink bg-surface p-6 shadow-card sm:p-10">
      <header>
        <p className="section-eyebrow">Your English highlights</p>
        <h2 className="text-3xl font-bold text-ink">
          A great conversation! 🌟
        </h2>
        <p className="mt-4 max-w-5xl text-lg leading-relaxed text-muted">
          {assessment.learnerSummary}
        </p>
        {pictureCount > 1 && (
          <p className="mt-2 text-base font-semibold text-eyebrow">
            Highlights from {pictureCount} pictures
          </p>
        )}
      </header>

      <section aria-labelledby="english-highlights-heading">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h3
            className="text-lg font-bold text-ink"
            id="english-highlights-heading"
          >
            What came through
          </h3>
          <p className="text-lg font-semibold text-muted">
            Enough examples for {assessedMetrics.length} of{" "}
            {availableMetricCount} areas
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assessedMetrics.map((metric) => (
            <article
              className="rounded-2xl border-2 border-ink bg-canvas p-5"
              key={metric.id}
            >
              <p className="text-lg font-bold text-ink">
                {metricLabel[metric.id]}
              </p>
              <p className="mt-1 text-xl font-bold text-ink">
                {bandLabel[metric.band!]}
              </p>
              {metric.strength && (
                <p className="mt-2 text-lg text-muted">{metric.strength}</p>
              )}
            </article>
          ))}
          {hasSpokenAnswers && (
            <article className="rounded-2xl border-2 border-dashed border-ink/35 bg-canvas p-5">
              <p className="text-lg font-bold text-ink">Pronunciation</p>
              <p className="mt-1 text-lg font-bold text-ink">Coming soon</p>
              <p className="mt-2 text-lg text-muted">
                Audio-aware pronunciation feedback is on the way.
              </p>
            </article>
          )}
        </div>

        {notAssessedMetrics.length > 0 && (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-ink/35 bg-canvas p-5 sm:p-6">
            <p className="font-bold text-ink">More examples needed</p>
            <ul className="mt-2 grid gap-2 text-lg text-muted sm:grid-cols-2">
              {notAssessedMetrics.map((metric) => (
                <li key={metric.id}>
                  <span className="font-semibold text-ink">
                    {metricLabel[metric.id]}:
                  </span>{" "}
                  {metric.unavailableReason ||
                    "We need another example to understand this."}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="rounded-2xl border-2 border-ink bg-accent-soft p-6">
        <p className="text-lg font-bold text-eyebrow">Try this next</p>
        <p className="mt-1 text-xl font-bold text-ink">
          {assessment.primaryRecommendation.skill.replaceAll("_", " ")}
        </p>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          {assessment.primaryRecommendation.reason}
        </p>
      </div>

      {nextConversationPrompt && (
        <p className="rounded-2xl bg-canvas p-5 text-lg leading-relaxed text-muted">
          If you keep talking, we can ask: “{nextConversationPrompt}”
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {canContinueConversation && (
          <button
            className="primary-button cursor-pointer bg-support text-ink"
            onClick={onContinueConversation}
            type="button"
          >
            Keep talking about this picture →
          </button>
        )}
        <button
          className="primary-button cursor-pointer bg-surface text-ink"
          onClick={onStartNewAssessment}
          type="button"
        >
          Try a new picture →
        </button>
        <button
          className="primary-button cursor-pointer "
          onClick={onContinueLearning}
          type="button"
        >
          Try your next challenge →
        </button>
      </div>
    </section>
  );
}
