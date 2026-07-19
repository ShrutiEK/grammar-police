import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { METRIC_IDS } from "../picture-conversation.schema";
import { PictureConversationResults } from "./picture-conversation-results";

describe("PictureConversationResults", () => {
  it("shows pronunciation as coming soon instead of an unavailable result", () => {
    const markup = renderToStaticMarkup(
      createElement(PictureConversationResults, {
        assessment: {
          learnerSummary: "You shared clear ideas.",
          metrics: METRIC_IDS.map((id) => ({
            confidence: "low" as const,
            evidence: [],
            id,
            status: "not_assessed" as const,
            unavailableReason:
              id === "pronunciation"
                ? "Coming soon."
                : "We need another example.",
          })),
          primaryRecommendation: {
            reason: "Practise adding one more detail.",
            skill: "detail_expansion",
            track: "expression",
          },
        },
        onContinueConversation: vi.fn(),
        onContinueLearning: vi.fn(),
        onStartNewAssessment: vi.fn(),
      }),
    );

    expect(markup).toContain("Pronunciation");
    expect(markup).toContain("Coming soon");
    expect(markup).toContain(
      "Audio-aware pronunciation feedback is on the way.",
    );
    expect(markup).toContain("0 of 7 observed");
  });

  it("labels a learning map combined from multiple pictures", () => {
    const markup = renderToStaticMarkup(
      createElement(PictureConversationResults, {
        assessment: {
          learnerSummary: "You shared clear ideas.",
          metrics: METRIC_IDS.map((id) => ({
            confidence: "low" as const,
            evidence: [],
            id,
            status: "not_assessed" as const,
            unavailableReason: "We need another example.",
          })),
          primaryRecommendation: {
            reason: "Practise adding one more detail.",
            skill: "detail_expansion",
            track: "expression",
          },
        },
        nextConversationPrompt: "Tell me about a similar experience.",
        onContinueConversation: vi.fn(),
        onContinueLearning: vi.fn(),
        onStartNewAssessment: vi.fn(),
        pictureCount: 2,
      }),
    );

    expect(markup).toContain("Cumulative result from 2 pictures");
    expect(markup).toContain("Tell me about a similar experience.");
  });
});
