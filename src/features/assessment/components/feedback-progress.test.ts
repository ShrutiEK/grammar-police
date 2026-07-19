import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FeedbackProgress } from "./feedback-progress";

describe("FeedbackProgress", () => {
  it("shows gradual, metric-specific progress inside the persistent panel", () => {
    const markup = renderToStaticMarkup(
      createElement(FeedbackProgress, {
        progress: {
          completedMetricIds: ["grammar", "writing_conventions"],
          stage: "calculating",
          totalMetrics: 6,
        },
      }),
    );

    expect(markup).toContain("2 of 6 highlights ready");
    expect(markup).toContain("Grammar");
    expect(markup).toContain("Spelling and writing");
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('role="status"');
  });

  it("explains the summarizing stage", () => {
    const markup = renderToStaticMarkup(
      createElement(FeedbackProgress, {
        progress: {
          completedMetricIds: ["grammar"],
          stage: "summarizing",
          totalMetrics: 1,
        },
      }),
    );

    expect(markup).toContain("Finishing your feedback");
    expect(markup).toContain("most useful next step");
    expect(markup).toContain('aria-valuenow="100"');
  });
});
