import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { RecordingPanel } from "./recording-panel";

function renderRecordingPanel(
  overrides: Partial<{
    hasResult: boolean;
    isAnalyzing: boolean;
    statusMessage: string;
  }> = {},
) {
  const {
    hasResult = false,
    isAnalyzing = false,
    statusMessage = "Ready when you are",
  } = overrides;

  return renderToStaticMarkup(
    createElement(RecordingPanel, {
      assessmentError: null,
      feedbackProgress: null,
      hasResult,
      isAnalyzing,
      isTranscribingLongRecording: false,
      isPreparing: false,
      isRecording: false,
      question: "What do you see in this picture?",
      recording: null,
      statusMessage,
      writtenAnswer: "",
      onAnalyzeRecording: vi.fn(),
      onStartRecording: vi.fn(),
      onStopRecording: vi.fn(),
      onSubmitWrittenAnswer: vi.fn(),
      onWrittenAnswerChange: vi.fn(),
    }),
  );
}

describe("RecordingPanel", () => {
  it("offers the answer choices and an enabled mic before any answer", () => {
    const markup = renderRecordingPanel();

    expect(markup).toContain("What do you see in this picture?");
    expect(markup).toContain("Speak");
    expect(markup).toContain("Write");
    expect(markup).toContain("Ready when you are");
    expect(markup).not.toContain('disabled=""');
  });

  it("disables the mic once feedback is ready for the current answer", () => {
    const markup = renderRecordingPanel({ hasResult: true });

    expect(markup).toContain('disabled=""');
    expect(markup).toContain("Your feedback is ready.");
  });

  it("disables the controls while an answer is being analyzed", () => {
    const markup = renderRecordingPanel({ isAnalyzing: true });

    expect(markup).toContain('disabled=""');
  });
});
