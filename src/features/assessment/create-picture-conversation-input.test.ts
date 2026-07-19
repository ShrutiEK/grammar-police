import { describe, expect, it } from "vitest";

import { createPictureConversationInput } from "./create-picture-conversation-input";
import type { AssessmentSession } from "./assessment-session.schema";

const session: AssessmentSession = {
  focusTopic: "the children flying a kite",
  questionsAndAnswers: [
    {
      answer: "Two children are flying a red kite.",
      answerMode: "spoken",
      audioDurationInSeconds: 7.5,
      assessment: {
        focusTopic: "the children flying a kite",
        isGrounded: true,
        isRelevantToFocus: true,
        languageHint: "",
        languageWarning: false,
        nextQuestion: "What else can you see near the kite?",
        nextQuestionType: "picture_follow_up",
      },
      number: 1,
      question: "Can you describe what you see in this picture?",
      questionType: "picture_follow_up",
    },
    {
      answer: "I fly kites with my sister at the beach.",
      answerMode: "written",
      assessment: {
        focusTopic: "the children flying a kite",
        isGrounded: true,
        isRelevantToFocus: true,
        languageHint: "",
        languageWarning: false,
        nextQuestion: "What did you enjoy about it?",
        nextQuestionType: "personal_follow_up",
      },
      number: 2,
      question: "Have you flown a kite with someone before?",
      questionType: "personal_follow_up",
    },
  ],
  selectedPictureFilename: "picnic.png",
};

describe("createPictureConversationInput", () => {
  it("preserves each answer's mode, conversation context, and safety signals", () => {
    expect(createPictureConversationInput(session)).toEqual({
      conversationMode: "picture",
      pictureFilename: "picnic.png",
      turns: [
        {
          answerMode: "spoken",
          audioDurationInSeconds: 7.5,
          isGrounded: true,
          isRelevantToFocus: true,
          kind: "scene_description",
          languageWarning: false,
          prompt: "Can you describe what you see in this picture?",
          responseText: "Two children are flying a red kite.",
        },
        {
          answerMode: "written",
          isGrounded: true,
          isRelevantToFocus: true,
          kind: "personal_follow_up",
          languageWarning: false,
          prompt: "Have you flown a kite with someone before?",
          responseText: "I fly kites with my sister at the beach.",
        },
      ],
    });
  });

  it("treats every DM with Pari answer as personal conversation evidence", () => {
    expect(
      createPictureConversationInput({
        ...session,
        conversationMode: "pari",
        pariTopicId: "hobbies",
      }),
    ).toMatchObject({
      conversationMode: "pari",
      pariTopicId: "hobbies",
      turns: [{ kind: "personal_follow_up" }, { kind: "personal_follow_up" }],
    });
  });
});
