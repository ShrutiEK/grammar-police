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
  overrides: Partial<{
    canChangePicture: boolean;
    isCheckpoint: boolean;
    isFinalQuestion: boolean;
    languageWarning: boolean;
    languageHint: string;
    pendingAction: "change-picture" | "continue" | "feedback" | null;
  }> = {},
) {
  const {
    canChangePicture = true,
    isCheckpoint = true,
    isFinalQuestion = false,
    languageWarning = false,
    languageHint = "",
    pendingAction = null,
  } = overrides;

  return renderToStaticMarkup(
    createElement(AssessmentResults, {
      assessment: { ...assessment, languageWarning, languageHint },
      canChangePicture,
      isCheckpoint,
      isFinalQuestion,
      onChangePicture: vi.fn(),
      onContinue: vi.fn(),
      onShowFeedback: vi.fn(),
      pendingAction,
    }),
  );
}

describe("AssessmentResults", () => {
  it("offers both keep-talking and feedback actions at a checkpoint", () => {
    const markup = renderAssessmentResults();

    expect(markup).toContain("Keep talking →");
    expect(markup).toContain("See my feedback →");
  });

  it("never renders the old inline continue-conversation button", () => {
    const markup = renderAssessmentResults();

    expect(markup).not.toContain("Continue conversation");
  });

  it("offers a picture change without removing the checkpoint actions", () => {
    const markup = renderAssessmentResults();

    expect(markup).toContain("Keep talking →");
    expect(markup).toContain("Change picture →");
    expect(markup).toContain("See my feedback →");
  });

  it("disables checkpoint actions while feedback is being prepared", () => {
    const markup = renderAssessmentResults({ pendingAction: "feedback" });

    expect(markup.match(/disabled=""/g)).toHaveLength(3);
    expect(markup).toContain(
      "Looking across your conversation and preparing your feedback",
    );
    expect(markup).toContain('role="status"');
  });

  it("shows progress while preparing the next question", () => {
    const markup = renderAssessmentResults({ pendingAction: "continue" });

    expect(markup.match(/disabled=""/g)).toHaveLength(3);
    expect(markup).toContain("Getting your next question ready");
  });

  it("keeps actions available when no action is pending", () => {
    const markup = renderAssessmentResults({ pendingAction: null });

    expect(markup).not.toContain('disabled=""');
    expect(markup).not.toContain('role="status"');
  });

  it("shows a single full-conversation feedback action on the final question", () => {
    const markup = renderAssessmentResults({
      isCheckpoint: false,
      isFinalQuestion: true,
    });

    expect(markup).toContain("See my conversation feedback →");
    expect(markup).not.toContain("Keep talking →");
  });

  it("renders nothing between checkpoints when there is no language warning", () => {
    const markup = renderAssessmentResults({
      isCheckpoint: false,
      isFinalQuestion: false,
    });

    expect(markup).toBe("");
  });

  it("still surfaces a language warning between checkpoints", () => {
    const markup = renderAssessmentResults({
      isCheckpoint: false,
      isFinalQuestion: false,
      languageWarning: true,
      languageHint: "Please answer in English.",
    });

    expect(markup).toContain("Please answer in English.");
    expect(markup).toContain('role="alert"');
  });
});
