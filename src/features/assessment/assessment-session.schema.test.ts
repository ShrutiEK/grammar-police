import { describe, expect, it } from "vitest";

import { assessmentSessionSchema } from "./assessment-session.schema";

const legacySession = {
  focusTopic: null,
  questionsAndAnswers: [
    {
      answer: null,
      answerMode: null,
      assessment: null,
      number: 1,
      question: "Can you describe what you see in this picture?",
    },
  ],
  selectedPictureFilename: "picnic.png",
};

describe("assessmentSessionSchema", () => {
  it("continues to accept saved sessions that predate question types", () => {
    expect(assessmentSessionSchema.safeParse(legacySession).success).toBe(true);
  });

  it("stores earlier picture segments with globally numbered questions", () => {
    const switchedSession = {
      ...legacySession,
      previousPictureSessions: [
        {
          focusTopic: "the family picnic",
          questionsAndAnswers: [
            {
              ...legacySession.questionsAndAnswers[0],
              answer: "A family is enjoying a picnic.",
              answerMode: "written",
              assessment: {
                focusTopic: "the family picnic",
                isGrounded: true,
                isRelevantToFocus: true,
                languageHint: "",
                languageWarning: false,
                nextQuestion: "Does this remind you of a picnic?",
                nextQuestionType: "personal_follow_up",
              },
            },
          ],
          selectedPictureFilename: "picnic.png",
        },
      ],
      questionsAndAnswers: [
        {
          ...legacySession.questionsAndAnswers[0],
          number: 2,
        },
      ],
      selectedPictureFilename: "railway.png",
    };

    expect(assessmentSessionSchema.safeParse(switchedSession).success).toBe(
      true,
    );
  });
});
