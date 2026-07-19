import { METRIC_BANDS } from "../picture-conversation.schema";

type MetricBand = (typeof METRIC_BANDS)[number];

export const bandLabel: Record<MetricBand, string> = {
  emerging: "Just starting",
  developing: "Growing",
  secure: "Getting steady",
  strong: "Strong",
};

const bandDescription: Record<MetricBand, string> = {
  emerging: "A new skill to practise",
  developing: "Showing up with support",
  secure: "Used reliably today",
  strong: "Used clearly and flexibly",
};

export function RatingSystem() {
  return (
    <aside
      aria-labelledby="rating-system-heading"
      className="rounded-3xl border-2 border-ink bg-support p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <p className="section-eyebrow mb-1">How ratings work</p>
          <h3
            className="text-2xl font-bold text-ink"
            id="rating-system-heading"
          >
            Four stops on a learning journey
          </h3>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Ratings describe what came through today. They are not grades, and
            every skill can keep growing.
          </p>
        </div>

        <ol className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          {METRIC_BANDS.map((band, index) => (
            <li className="rounded-2xl bg-surface p-3" key={band}>
              <div aria-hidden="true" className="mb-2 flex items-center gap-1">
                {METRIC_BANDS.map((step, stepIndex) => (
                  <span
                    className={`h-2.5 flex-1 rounded-full border border-ink ${
                      stepIndex <= index ? "bg-accent" : "bg-canvas"
                    }`}
                    key={step}
                  />
                ))}
              </div>
              <p className="font-bold leading-tight text-ink">
                {bandLabel[band]}
              </p>
              <p className="mt-1 text-sm leading-snug text-muted">
                {bandDescription[band]}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

export function BandMeter({ band }: Readonly<{ band: MetricBand }>) {
  const activeIndex = METRIC_BANDS.indexOf(band);

  return (
    <div
      aria-label={`${bandLabel[band]}: level ${activeIndex + 1} of ${METRIC_BANDS.length}`}
      className="flex gap-1.5"
      role="img"
    >
      {METRIC_BANDS.map((step, index) => (
        <span
          className={`h-2.5 flex-1 rounded-full border border-ink ${
            index <= activeIndex ? "bg-accent" : "bg-canvas"
          }`}
          key={step}
        />
      ))}
    </div>
  );
}
