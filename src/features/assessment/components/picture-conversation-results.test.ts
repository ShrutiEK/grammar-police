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
        hasSpokenAnswers: true,
        hasWrittenAnswers: false,
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
    expect(markup).toContain("Enough examples for 0 of 6 areas");
  });

  it("shows spelling feedback instead of pronunciation for written answers", () => {
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
        hasSpokenAnswers: false,
        hasWrittenAnswers: true,
        onContinueConversation: vi.fn(),
        onContinueLearning: vi.fn(),
        onStartNewAssessment: vi.fn(),
      }),
    );

    expect(markup).toContain("Spelling and writing");
    expect(markup).not.toContain("Pronunciation");
    expect(markup).not.toContain("Speaking flow");
    expect(markup).toContain("Enough examples for 0 of 6 areas");
  });

  it("labels feedback combined from multiple pictures", () => {
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
        hasSpokenAnswers: false,
        hasWrittenAnswers: true,
        nextConversationPrompt: "Tell me about a similar experience.",
        onContinueConversation: vi.fn(),
        onContinueLearning: vi.fn(),
        onStartNewAssessment: vi.fn(),
        pictureCount: 2,
      }),
    );

    expect(markup).toContain("Highlights from 2 pictures");
    expect(markup).toContain("Tell me about a similar experience.");
  });

  it("shows a growth area, not only a strength, on an assessed metric card", () => {
    const markup = renderToStaticMarkup(
      createElement(PictureConversationResults, {
        assessment: {
          learnerSummary: "You shared clear ideas.",
          metrics: METRIC_IDS.map((id) =>
            id === "grammar"
              ? {
                  band: "developing" as const,
                  confidence: "high" as const,
                  evidence: [
                    {
                      correctedText: "The children are playing.",
                      learnerText: "The children is playing.",
                      observation: "Match the verb to plural subjects.",
                      turn: "scene_description" as const,
                    },
                  ],
                  findingStatus: "supported" as const,
                  id,
                  nextSkill: "subject_verb_agreement" as const,
                  status: "assessed" as const,
                  strength: "You built a clear sentence.",
                }
              : {
                  confidence: "low" as const,
                  evidence: [],
                  id,
                  status: "not_assessed" as const,
                  unavailableReason: "We need another example.",
                },
          ),
          primaryRecommendation: {
            reason: "Practise subject verb agreement.",
            skill: "subject_verb_agreement",
            track: "grammar",
          },
        },
        hasSpokenAnswers: false,
        hasWrittenAnswers: true,
        onContinueConversation: vi.fn(),
        onContinueLearning: vi.fn(),
        onStartNewAssessment: vi.fn(),
      }),
    );

    expect(markup).toContain("You built a clear sentence.");
    expect(markup).toContain("To grow");
    expect(markup).toContain("Match the verb to plural subjects.");
    expect(markup).toContain("Practise subject verb agreement.");
  });

  it("does not offer a targeted lesson when no learning gap is supported", () => {
    const markup = renderToStaticMarkup(
      createElement(PictureConversationResults, {
        assessment: {
          learnerSummary:
            "You shared clear English. No single learning gap stood out.",
          metrics: METRIC_IDS.map((id) => ({
            band: "strong" as const,
            confidence: "high" as const,
            evidence: [
              {
                learnerText: "She's playing football.",
                observation: "The sentence is clear.",
                turn: "scene_description" as const,
              },
            ],
            findingStatus: "no_gap" as const,
            id,
            status: "assessed" as const,
            strength: "You communicated clearly.",
          })),
        },
        hasSpokenAnswers: true,
        hasWrittenAnswers: false,
        onContinueConversation: vi.fn(),
        onContinueLearning: vi.fn(),
        onStartNewAssessment: vi.fn(),
      }),
    );

    expect(markup).toContain("No single learning gap stood out");
    expect(markup).not.toContain("To grow");
    expect(markup).not.toContain("Try your next challenge");
  });
});
