import type { PictureConversationAssessment } from "../picture-conversation.schema";

type PictureConversationResultsProperties = Readonly<{
  assessment: PictureConversationAssessment;
  canContinueConversation?: boolean;
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
  writing_conventions: "Writing details",
} as const;

export function PictureConversationResults({
  assessment,
  canContinueConversation = true,
  nextConversationPrompt,
  pictureCount = 1,
  onContinueConversation,
  onContinueLearning,
  onStartNewAssessment,
}: PictureConversationResultsProperties) {
  const assessedMetrics = assessment.metrics.filter(
    (metric) => metric.status === "assessed",
  );
  const notAssessedMetrics = assessment.metrics.filter(
    (metric) =>
      metric.status === "not_assessed" && metric.id !== "pronunciation",
  );
  const availableMetricCount = assessment.metrics.filter(
    (metric) => metric.id !== "pronunciation",
  ).length;

  return (
    <section className="space-y-6 rounded-[2rem] border-[3px] border-ink bg-white p-6 shadow-card sm:p-8">
      <header>
        <p className="section-eyebrow">Your learning map</p>
        <h2 className="text-3xl font-bold text-ink">
          A great conversation! 🌟
        </h2>
        <p className="mt-3 text-muted">{assessment.learnerSummary}</p>
        {pictureCount > 1 && (
          <p className="mt-2 text-sm font-semibold text-eyebrow">
            Cumulative result from {pictureCount} pictures
          </p>
        )}
      </header>

      <section aria-labelledby="skill-snapshot-heading">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3
            className="text-lg font-bold text-ink"
            id="skill-snapshot-heading"
          >
            Your skill snapshot
          </h3>
          <p className="text-sm text-muted">
            {assessedMetrics.length} of {availableMetricCount} observed
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assessedMetrics.map((metric) => (
            <article
              className="rounded-2xl border-2 border-ink bg-canvas p-4"
              key={metric.id}
            >
              <p className="text-xs font-bold uppercase text-muted">
                {metricLabel[metric.id]}
              </p>
              <p className="mt-1 text-lg font-bold text-ink">
                {bandLabel[metric.band!]}
              </p>
              {metric.strength && (
                <p className="mt-2 text-sm text-muted">{metric.strength}</p>
              )}
            </article>
          ))}
          <article className="rounded-2xl border-2 border-dashed border-ink/35 bg-[#fffaf0] p-4">
            <p className="text-xs font-bold uppercase text-muted">
              Pronunciation
            </p>
            <p className="mt-1 text-lg font-bold text-ink">Coming soon</p>
            <p className="mt-2 text-sm text-muted">
              Audio-aware pronunciation feedback is on the way.
            </p>
          </article>
        </div>

        {notAssessedMetrics.length > 0 && (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-ink/35 bg-[#fffaf0] p-4">
            <p className="font-bold text-ink">Not measured yet</p>
            <ul className="mt-2 grid gap-2 text-sm text-muted sm:grid-cols-2">
              {notAssessedMetrics.map((metric) => (
                <li key={metric.id}>
                  <span className="font-semibold text-ink">
                    {metricLabel[metric.id]}:
                  </span>
                  {metric.unavailableReason ||
                    "We need another example to understand this."}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="rounded-2xl border-2 border-ink bg-accent-soft p-5">
        <p className="text-xs font-bold uppercase text-eyebrow">
          Next superpower
        </p>
        <p className="mt-1 text-xl font-bold text-ink">
          {assessment.primaryRecommendation.skill.replaceAll("_", " ")}
        </p>
        <p className="mt-2 text-sm text-muted">
          {assessment.primaryRecommendation.reason}
        </p>
      </div>

      {nextConversationPrompt && (
        <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">
          If you keep talking, we can ask: “{nextConversationPrompt}”
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {canContinueConversation && (
          <button
            className="primary-button cursor-pointer bg-support"
            onClick={onContinueConversation}
            type="button"
          >
            Keep talking about this picture →
          </button>
        )}
        <button
          className="primary-button cursor-pointer bg-white"
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
          Continue to learn →
        </button>
      </div>
    </section>
  );
}
