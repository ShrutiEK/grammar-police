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
});
