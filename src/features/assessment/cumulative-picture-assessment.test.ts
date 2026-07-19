import { describe, expect, it } from "vitest";

import { createCumulativePictureAssessment } from "./cumulative-picture-assessment";
import {
  archivePictureAssessment,
  loadPictureAssessmentHistory,
  type PictureAssessmentAttempt,
} from "./picture-assessment-history";
import {
  METRIC_IDS,
  type MetricId,
  type PictureConversationFeedback,
  type PictureConversationMetricResult,
  type PictureConversationTurn,
} from "./picture-conversation.schema";

function createStorage() {
  const values = new Map<string, string>();

  return {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: () => null,
    get length() {
      return values.size;
    },
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  } as Storage;
}

const firstTurn: PictureConversationTurn = {
  answerMode: "written",
  isGrounded: true,
  isRelevantToFocus: true,
  kind: "scene_description",
  languageWarning: false,
  prompt: "Describe the picture.",
  responseText: "A family is meeting at a railway station.",
};

const secondTurn: PictureConversationTurn = {
  answerMode: "written",
  isGrounded: true,
  isRelevantToFocus: true,
  kind: "personal_follow_up",
  languageWarning: false,
  prompt: "Does this remind you of an experience?",
  responseText: "I met my grandparents after a long journey last year.",
};

function createFeedback(
  overrides: Partial<Record<MetricId, PictureConversationMetricResult>>,
): PictureConversationFeedback {
  return {
    assessment: {
      learnerSummary: "You shared useful ideas.",
      metrics: METRIC_IDS.map(
        (id): PictureConversationMetricResult =>
          overrides[id] || {
            confidence: "low",
            evidence: [],
            id,
            status: "not_assessed",
            unavailableReason: "We need another example.",
          },
      ),
      primaryRecommendation: {
        reason: "Practise adding one more detail.",
        skill: "detail_expansion",
        track: "expression",
      },
    },
    status: "assessed",
  };
}

function createAttempt(
  pictureFilename: PictureAssessmentAttempt["input"]["pictureFilename"],
  turns: PictureConversationTurn[],
  feedback: PictureConversationFeedback,
): PictureAssessmentAttempt {
  return { feedback, input: { pictureFilename, turns } };
}

describe("picture assessment continuity", () => {
  it("replaces an earlier checkpoint from the same conversation", () => {
    const storage = createStorage();
    const feedback = createFeedback({});

    archivePictureAssessment(
      createAttempt("railway.png", [firstTurn], feedback),
      storage,
    );
    archivePictureAssessment(
      createAttempt("railway.png", [firstTurn, secondTurn], feedback),
      storage,
    );

    const history = loadPictureAssessmentHistory(storage);

    expect(history).toHaveLength(1);
    expect(history[0]?.input.turns).toHaveLength(2);
  });

  it("combines assessed metrics across pictures using confidence weighting", () => {
    const earlierAttempt = createAttempt(
      "railway.png",
      [firstTurn],
      createFeedback({
        grammar: {
          band: "emerging",
          confidence: "high",
          evidence: [],
          id: "grammar",
          nextSkill: "articles",
          status: "assessed",
          strength: "Uses some complete sentence structures.",
        },
        vocabulary: {
          band: "secure",
          confidence: "medium",
          evidence: [],
          id: "vocabulary",
          nextSkill: "precise_nouns",
          status: "assessed",
          strength: "Uses precise travel vocabulary.",
        },
      }),
    );
    const currentAttempt = createAttempt(
      "picnic.png",
      [firstTurn],
      createFeedback({
        grammar: {
          band: "strong",
          confidence: "low",
          evidence: [],
          id: "grammar",
          nextSkill: "articles",
          status: "assessed",
          strength: "Uses varied sentence structures.",
        },
      }),
    );

    const cumulative = createCumulativePictureAssessment([
      earlierAttempt,
      currentAttempt,
    ]);
    const grammar = cumulative.metrics.find(
      (metric) => metric.id === "grammar",
    );
    const vocabulary = cumulative.metrics.find(
      (metric) => metric.id === "vocabulary",
    );

    expect(grammar?.band).toBe("developing");
    expect(vocabulary?.band).toBe("secure");
  });

  it("does not turn an unmeasured result into a zero score", () => {
    const measuredAttempt = createAttempt(
      "railway.png",
      [firstTurn],
      createFeedback({
        conversation: {
          band: "secure",
          confidence: "medium",
          evidence: [],
          id: "conversation",
          nextSkill: "turn_taking",
          status: "assessed",
          strength: "Responds naturally to a follow-up.",
        },
      }),
    );
    const unmeasuredAttempt = createAttempt(
      "beach.png",
      [firstTurn],
      createFeedback({}),
    );

    const cumulative = createCumulativePictureAssessment([
      measuredAttempt,
      unmeasuredAttempt,
    ]);

    expect(
      cumulative.metrics.find((metric) => metric.id === "conversation")?.band,
    ).toBe("secure");
  });
});
