import { describe, expect, it, vi } from "vitest";

import type { LearnerAssessment } from "./assessment.schema";
import {
  assessStudentEnglishWithFallback,
  transcribeStudentRecordingWithFallback,
} from "./student-answer-provider-fallback";
import type { AssessStudentEnglishInput } from "./student-answer-provider.types";

const input: AssessStudentEnglishInput = {
  conversationContext: [],
  currentQuestion: "What can you see?",
  currentQuestionType: "picture_follow_up",
  focusTopic: null,
  pictureDescription: "Two children are flying a kite in a park.",
  transcript: "Two children are flying a kite.",
};

const assessment: LearnerAssessment = {
  focusTopic: "flying a kite",
  isGrounded: true,
  isRelevantToFocus: true,
  languageHint: "",
  languageWarning: false,
  nextQuestion: "When did you last fly a kite?",
  nextQuestionType: "personal_follow_up",
};

describe("student answer provider fallback", () => {
  it("does not call OpenAI when Sarvam transcription succeeds", async () => {
    const transcribeWithSarvam = vi.fn().mockResolvedValue({
      status: "completed",
      transcript: "A clear answer.",
    });
    const transcribeWithOpenAi = vi.fn();
    const audioFile = new File(["audio"], "answer.webm", {
      type: "audio/webm",
    });

    await expect(
      transcribeStudentRecordingWithFallback(audioFile, 10, {
        transcribeWithOpenAi,
        transcribeWithSarvam,
      }),
    ).resolves.toEqual({
      status: "completed",
      transcript: "A clear answer.",
    });
    expect(transcribeWithOpenAi).not.toHaveBeenCalled();
  });

  it("uses OpenAI when Sarvam transcription fails", async () => {
    const transcribeWithSarvam = vi
      .fn()
      .mockRejectedValue(new Error("Sarvam unavailable"));
    const transcribeWithOpenAi = vi.fn().mockResolvedValue({
      status: "completed",
      transcript: "OpenAI transcript.",
    });
    const audioFile = new File(["audio"], "answer.webm", {
      type: "audio/webm",
    });

    await expect(
      transcribeStudentRecordingWithFallback(audioFile, 10, {
        transcribeWithOpenAi,
        transcribeWithSarvam,
      }),
    ).resolves.toEqual({
      status: "completed",
      transcript: "OpenAI transcript.",
    });
    expect(transcribeWithOpenAi).toHaveBeenCalledWith(audioFile, 10);
  });

  it("uses OpenAI when Sarvam answer evaluation fails", async () => {
    const assessWithSarvam = vi
      .fn()
      .mockRejectedValue(new Error("Sarvam unavailable"));
    const assessWithOpenAi = vi.fn().mockResolvedValue(assessment);

    await expect(
      assessStudentEnglishWithFallback(input, {
        assessWithOpenAi,
        assessWithSarvam,
      }),
    ).resolves.toEqual(assessment);
    expect(assessWithOpenAi).toHaveBeenCalledWith(input);
  });
});
