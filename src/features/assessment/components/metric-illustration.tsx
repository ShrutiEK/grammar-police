import type { MetricId } from "../picture-conversation.schema";

const metricSymbol: Record<MetricId, string> = {
  conversation: "💬",
  expression: "✨",
  grammar: "🧩",
  pronunciation: "🎧",
  scene_understanding: "🔎",
  spoken_fluency: "〰️",
  vocabulary: "🪁",
  writing_conventions: "✏️",
};

export function MetricIllustration({
  metricId,
}: Readonly<{ metricId: MetricId }>) {
  return (
    <div
      aria-hidden="true"
      className="relative grid h-24 w-full place-items-center overflow-hidden rounded-2xl bg-support"
    >
      <span className="absolute -left-4 -top-6 size-20 rounded-full border-2 border-ink/15 bg-accent-soft" />
      <span className="absolute -bottom-5 -right-3 size-16 rotate-12 rounded-2xl border-2 border-ink/15 bg-surface" />
      <span className="relative text-5xl drop-shadow-[2px_3px_0_rgba(23,33,61,0.18)]">
        {metricSymbol[metricId]}
      </span>
    </div>
  );
}
