import type { PictureConversationAssessment } from "./learning-assessment.schema";

type MockLessonKey = "adjectives" | "articles" | "actions" | "connectors";

function createMockAssessment(
  input: Readonly<{
    metricId: "grammar" | "vocabulary" | "expression";
    track: "grammar" | "vocabulary" | "expression";
    skill:
      | "descriptive_adjectives"
      | "articles"
      | "present_continuous"
      | "sentence_connectors";
    learnerText: string;
    observation: string;
    reason: string;
  }>,
): PictureConversationAssessment {
  return {
    metrics: [
      {
        id: input.metricId,
        status: "assessed",
        band: "emerging",
        confidence: "high",
        evidence: [
          {
            turn: "scene_description",
            learnerText: input.learnerText,
            observation: input.observation,
          },
        ],
        nextSkill: input.skill,
      },
    ],
    primaryRecommendation: {
      track: input.track,
      skill: input.skill,
      reason: input.reason,
    },
    learnerSummary:
      "You communicated your main idea. Now we will strengthen one useful skill.",
  };
}

export const mockLessonAssessments: Record<
  MockLessonKey,
  PictureConversationAssessment
> = {
  adjectives: createMockAssessment({
    metricId: "vocabulary",
    track: "vocabulary",
    skill: "descriptive_adjectives",
    learnerText: "There is a kite. There is a market. There is a dog.",
    observation: "The learner used relevant nouns but few descriptive details.",
    reason:
      "Adding precise adjectives will make your descriptions vivid quickly.",
  }),
  articles: createMockAssessment({
    metricId: "grammar",
    track: "grammar",
    skill: "articles",
    learnerText: "I see dog near tree and orange kite.",
    observation: "Articles were repeatedly missing before singular nouns.",
    reason:
      "Practising a, an, and the will make your sentences sound complete.",
  }),
  actions: createMockAssessment({
    metricId: "grammar",
    track: "grammar",
    skill: "present_continuous",
    learnerText: "The children playing. The woman shop.",
    observation: "Actions happening now need am, is, or are plus an -ing verb.",
    reason:
      "This pattern will immediately improve how you describe live scenes.",
  }),
  connectors: createMockAssessment({
    metricId: "expression",
    track: "expression",
    skill: "sentence_connectors",
    learnerText: "It is raining. The children play. They have umbrellas.",
    observation: "The ideas are clear but remain separate and repetitive.",
    reason:
      "Connectors will help you turn short ideas into smooth explanations.",
  }),
};

export const mockLessonLabels: Record<MockLessonKey, string> = {
  adjectives: "Weak adjectives",
  articles: "Missing articles",
  actions: "Action grammar",
  connectors: "Disconnected ideas",
};

export const demoLessonAssessment = mockLessonAssessments.adjectives;

export function isMockLessonKey(value: string): value is MockLessonKey {
  return value in mockLessonAssessments;
}

/*
 * Remove this file and the mock controls in lesson-loader.tsx once the real
 * evaluator writes its assessment to session storage.
 */
export const exampleFullAssessment: PictureConversationAssessment = {
  metrics: [
    {
      id: "grammar",
      status: "assessed",
      band: "secure",
      confidence: "high",
      evidence: [
        {
          turn: "scene_description",
          learnerText: "The children are playing and a woman is shopping.",
          observation: "The learner formed clear action sentences.",
        },
      ],
      strength: "You used complete action sentences.",
    },
    {
      id: "vocabulary",
      status: "assessed",
      band: "emerging",
      confidence: "high",
      evidence: [
        {
          turn: "scene_description",
          learnerText: "There is a kite. There is a market. There is a dog.",
          observation:
            "The nouns are relevant, but they need descriptive details to help a listener picture the scene.",
        },
      ],
      nextSkill: "descriptive_adjectives",
    },
  ],
  primaryRecommendation: {
    track: "vocabulary",
    skill: "descriptive_adjectives",
    reason:
      "You named the important objects clearly. Adding precise adjectives will make your descriptions vivid quickly.",
  },
  learnerSummary:
    "You shared clear ideas. Your next step is to add vivid details.",
};
