import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AssessmentResults } from "./assessment-results";

const assessment = {
  focusTopic: "the kite",
  isGrounded: true,
  isRelevantToFocus: true,
  languageHint: "",
  languageWarning: false,
  nextQuestion: "What is near the kite?",
  nextQuestionType: "picture_follow_up" as const,
};

function renderAssessmentResults(
  pendingAction: "continue" | "feedback" | null,
) {
  return renderToStaticMarkup(
    createElement(AssessmentResults, {
      assessment,
      isCheckpoint: true,
      isFinalQuestion: false,
      onContinue: vi.fn(),
      onShowFeedback: vi.fn(),
      pendingAction,
    }),
  );
}

describe("AssessmentResults", () => {
  it("disables both checkpoint actions while feedback is being prepared", () => {
    const markup = renderAssessmentResults("feedback");

    expect(markup.match(/disabled=""/g)).toHaveLength(2);
    expect(markup).toContain(
      "Looking across your conversation and preparing your feedback",
    );
    expect(markup).toContain('role="status"');
  });

  it("shows progress while preparing the next question", () => {
    const markup = renderAssessmentResults("continue");

    expect(markup.match(/disabled=""/g)).toHaveLength(2);
    expect(markup).toContain("Getting your next question ready");
  });

  it("keeps both actions available when no action is pending", () => {
    const markup = renderAssessmentResults(null);

    expect(markup).not.toContain('disabled=""');
    expect(markup).not.toContain('role="status"');
  });
});
