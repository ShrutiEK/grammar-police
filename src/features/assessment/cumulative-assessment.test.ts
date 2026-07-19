import { describe, expect, it } from "vitest";

import type { ConversationTurn } from "./assessment-session.schema";
import { calculateCumulativeScores } from "./cumulative-assessment";

function createTurn(
  number: number,
  scores: {
    vocabulary: number;
    grammar: number;
    reasoning: number;
    sentenceComplexity: number;
    communication: number;
  },
  validity: Partial<{
    isGrounded: boolean;
    isRelevantToFocus: boolean;
    languageWarning: boolean;
  }> = {},
): ConversationTurn {
  return {
    number,
    question: `Question ${number}`,
    answer: `Answer ${number}`,
    answerMode: "written",
    assessment: {
      scores,
      feedback: "Helpful feedback.",
      languageWarning: validity.languageWarning ?? false,
      languageHint: "",
      isGrounded: validity.isGrounded ?? true,
      isRelevantToFocus: validity.isRelevantToFocus ?? true,
      focusTopic: "the kite",
      nextQuestion: "What colour is the kite?",
    },
  };
}

describe("calculateCumulativeScores", () => {
  it("averages all communication metrics across valid answers", () => {
    const scores = calculateCumulativeScores([
      createTurn(1, {
        vocabulary: 3,
        grammar: 2,
        reasoning: 4,
        sentenceComplexity: 2,
        communication: 3,
      }),
      createTurn(2, {
        vocabulary: 5,
        grammar: 4,
        reasoning: 2,
        sentenceComplexity: 4,
        communication: 5,
      }),
    ]);

    expect(scores).toEqual({
      vocabulary: 4,
      grammar: 3,
      reasoning: 3,
      sentenceComplexity: 3,
      communication: 4,
    });
  });

  it("excludes ungrounded, off-topic, and non-English answers", () => {
    const includedTurn = createTurn(1, {
      vocabulary: 4,
      grammar: 4,
      reasoning: 4,
      sentenceComplexity: 4,
      communication: 4,
    });
    const excludedTurn = createTurn(
      2,
      {
        vocabulary: 1,
        grammar: 1,
        reasoning: 1,
        sentenceComplexity: 1,
        communication: 1,
      },
      { languageWarning: true },
    );

    expect(calculateCumulativeScores([includedTurn, excludedTurn])).toEqual({
      vocabulary: 4,
      grammar: 4,
      reasoning: 4,
      sentenceComplexity: 4,
      communication: 4,
    });
  });
});
