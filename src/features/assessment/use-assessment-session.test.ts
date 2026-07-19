import { describe, expect, it } from "vitest";

import type { AssessmentSession } from "./assessment-session.schema";
import { createSwitchedPictureSession } from "./assessment-session";

const completedAssessment = {
  focusTopic: "the family picnic",
  isGrounded: true,
  isRelevantToFocus: true,
  languageHint: "",
  languageWarning: false,
  nextQuestion: "Does this remind you of a picnic?",
  nextQuestionType: "personal_follow_up" as const,
};

describe("picture switching within an assessment", () => {
  it("keeps the earlier picture and starts the new description at the next global number", () => {
    const currentSession: AssessmentSession = {
      focusTopic: "the family picnic",
      questionsAndAnswers: [
        {
          answer: "A family is having a picnic.",
          answerMode: "written",
          assessment: completedAssessment,
          number: 1,
          question: "Describe the picture.",
          questionType: "picture_follow_up",
        },
        {
          answer: "I had a picnic with my cousins last year.",
          answerMode: "written",
          assessment: completedAssessment,
          number: 2,
          question: "Does this remind you of an experience?",
          questionType: "personal_follow_up",
        },
      ],
      selectedPictureFilename: "picnic.png",
    };

    const switchedSession = createSwitchedPictureSession(
      currentSession,
      "railway.png",
    );

    expect(switchedSession.selectedPictureFilename).toBe("railway.png");
    expect(switchedSession.focusTopic).toBeNull();
    expect(switchedSession.questionsAndAnswers).toEqual([
      expect.objectContaining({
        answer: null,
        number: 3,
        question: "Can you describe what you see in this picture?",
      }),
    ]);
    expect(switchedSession.previousPictureSessions).toEqual([
      expect.objectContaining({
        questionsAndAnswers: currentSession.questionsAndAnswers,
        selectedPictureFilename: "picnic.png",
      }),
    ]);
  });

  it("skips an unanswered picture without consuming a question", () => {
    const unansweredSession: AssessmentSession = {
      focusTopic: null,
      questionsAndAnswers: [
        {
          answer: null,
          answerMode: null,
          assessment: null,
          number: 1,
          question: "Describe the picture.",
          questionType: "picture_follow_up",
        },
      ],
      selectedPictureFilename: "picnic.png",
    };

    const switchedSession = createSwitchedPictureSession(
      unansweredSession,
      "railway.png",
    );

    expect(switchedSession.selectedPictureFilename).toBe("railway.png");
    expect(switchedSession.questionsAndAnswers[0]?.number).toBe(1);
    expect(switchedSession.previousPictureSessions).toEqual([]);
    expect(switchedSession.viewedPictureFilenames).toEqual([
      "picnic.png",
      "railway.png",
    ]);
  });

  it("keeps answered turns but discards an unanswered prompt when switching", () => {
    const session: AssessmentSession = {
      focusTopic: "the family picnic",
      questionsAndAnswers: [
        {
          answer: "A family is having a picnic.",
          answerMode: "written",
          assessment: completedAssessment,
          number: 1,
          question: "Describe the picture.",
          questionType: "picture_follow_up",
        },
        {
          answer: null,
          answerMode: null,
          assessment: null,
          number: 2,
          question: "Does this remind you of an experience?",
          questionType: "personal_follow_up",
        },
      ],
      selectedPictureFilename: "picnic.png",
    };

    const switchedSession = createSwitchedPictureSession(
      session,
      "railway.png",
    );

    expect(switchedSession.questionsAndAnswers[0]?.number).toBe(2);
    expect(
      switchedSession.previousPictureSessions?.[0]?.questionsAndAnswers,
    ).toHaveLength(1);
  });
});
