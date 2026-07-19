import type {
  MetricId,
  PictureConversationProgress,
} from "../picture-conversation.schema";

type FeedbackProgressProperties = Readonly<{
  progress: PictureConversationProgress;
}>;

const metricLabel = {
  conversation: "Conversation",
  expression: "Sharing ideas",
  grammar: "Grammar",
  pronunciation: "Pronunciation",
  scene_understanding: "Picture understanding",
  spoken_fluency: "Speaking flow",
  vocabulary: "Word choice",
  writing_conventions: "Spelling and writing",
} as const satisfies Record<MetricId, string>;

function getProgressCopy(progress: PictureConversationProgress) {
  const completedCount = progress.completedMetricIds.length;

  switch (progress.stage) {
    case "reading":
      return {
        description:
          "Gathering your answers and finding the areas where we have enough examples to help.",
        heading: "Reading your conversation…",
      };
    case "calculating":
      return {
        description:
          completedCount === 0
            ? `We found ${progress.totalMetrics} areas to explore. We look at each one separately so your feedback stays useful.`
            : "Your ready highlights are shown below while we look at the rest.",
        heading:
          completedCount === 0
            ? `Exploring ${progress.totalMetrics} areas…`
            : `${completedCount} of ${progress.totalMetrics} highlights ready`,
      };
    case "retrying":
      return {
        description:
          "One step paused, so we’re preparing your feedback another way. Your answers are safe.",
        heading: "Preparing your feedback another way…",
      };
    case "summarizing":
      return {
        description:
          "Bringing your strengths, examples, and most useful next step together.",
        heading: "Finishing your feedback…",
      };
  }
}

function getProgressValue(progress: PictureConversationProgress) {
  if (progress.stage === "reading") {
    return 5;
  }

  if (progress.stage === "retrying") {
    return 10;
  }

  if (progress.stage === "summarizing") {
    return 100;
  }

  if (progress.totalMetrics === 0) {
    return 15;
  }

  return Math.max(
    15,
    Math.round(
      (progress.completedMetricIds.length / progress.totalMetrics) * 85,
    ),
  );
}

export function FeedbackProgress({ progress }: FeedbackProgressProperties) {
  const copy = getProgressCopy(progress);
  const progressValue = getProgressValue(progress);

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="flex min-h-[28rem] flex-col justify-center"
      role="status"
    >
      <div className="mx-auto w-full max-w-xl text-center">
        <div
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-full border-2 border-ink bg-accent-soft text-3xl shadow-[4px_4px_0_#17213d] motion-safe:animate-pulse"
        >
          ✨
        </div>
        <p className="section-eyebrow mt-5">Building your feedback</p>
        <h2
          className="mt-2 text-2xl font-bold text-ink"
          id="feedback-progress-title"
        >
          {copy.heading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted">
          {copy.description}
        </p>

        <div
          aria-label="Feedback preparation progress"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progressValue}
          className="mt-6 h-3 overflow-hidden rounded-full border border-ink bg-canvas"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-support transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progressValue}%` }}
          />
        </div>

        {progress.completedMetricIds.length > 0 && (
          <ul
            aria-label="Calculated insights"
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            {progress.completedMetricIds.map((metricId) => (
              <li
                className="rounded-full border-2 border-ink/60 bg-canvas px-4 py-2 text-base font-bold text-ink"
                key={metricId}
              >
                <span aria-hidden="true">✓ </span>
                {metricLabel[metricId]}
              </li>
            ))}
          </ul>
        )}

        <ol className="mt-6 grid grid-cols-3 gap-3 text-base font-bold text-muted">
          <li className={progress.stage === "reading" ? "text-ink" : ""}>
            Read answers
          </li>
          <li
            className={
              progress.stage === "calculating" || progress.stage === "retrying"
                ? "text-ink"
                : ""
            }
          >
            Find highlights
          </li>
          <li className={progress.stage === "summarizing" ? "text-ink" : ""}>
            Finish feedback
          </li>
        </ol>
      </div>
    </div>
  );
}
