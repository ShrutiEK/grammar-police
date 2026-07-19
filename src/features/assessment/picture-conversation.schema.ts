import { z } from "zod";

export const conversationTurnKindSchema = z.enum([
  "scene_description",
  "picture_follow_up",
  "personal_follow_up",
  "unknown",
]);

export const pictureConversationTurnSchema = z.object({
  answerMode: z.enum(["spoken", "written"]),
  audioDurationInSeconds: z.number().positive().max(600).optional(),
  isGrounded: z.boolean(),
  isRelevantToFocus: z.boolean(),
  kind: conversationTurnKindSchema,
  languageWarning: z.boolean(),
  prompt: z.string().trim().min(1),
  responseText: z.string().trim().min(1),
});

export type PictureConversationTurn = z.infer<
  typeof pictureConversationTurnSchema
>;

export const METRIC_IDS = [
  "scene_understanding",
  "grammar",
  "vocabulary",
  "expression",
  "conversation",
  "writing_conventions",
  "spoken_fluency",
  "pronunciation",
] as const;

export const METRIC_BANDS = [
  "emerging",
  "developing",
  "secure",
  "strong",
] as const;

export const LEARNING_TRACKS = [
  "grammar",
  "vocabulary",
  "expression",
  "conversation",
  "scene_description",
  "spoken_fluency",
  "pronunciation",
  "writing_conventions",
] as const;

export const LEARNING_SKILLS = [
  "articles",
  "present_continuous",
  "past_tense",
  "future_forms",
  "subject_verb_agreement",
  "plural_nouns",
  "prepositions",
  "pronouns",
  "question_forms",
  "precise_nouns",
  "action_verbs",
  "descriptive_adjectives",
  "descriptive_adverbs",
  "word_variety",
  "topic_vocabulary",
  "complete_sentences",
  "sentence_connectors",
  "sentence_variety",
  "narrative_sequence",
  "detail_expansion",
  "answer_expansion",
  "turn_taking",
  "scene_detail_noticing",
  "spatial_language",
  "action_relationships",
  "read_aloud_pacing",
  "pause_chunking",
  "filler_reduction",
  "sound_articulation",
  "word_stress",
  "sentence_stress_and_intonation",
  "spelling",
  "capitalisation",
  "punctuation",
] as const;

const metricIdSchema = z.enum(METRIC_IDS);
const metricBandSchema = z.enum(METRIC_BANDS);
const learningTrackSchema = z.enum(LEARNING_TRACKS);
const learningSkillSchema = z.enum(LEARNING_SKILLS);

export type MetricId = z.infer<typeof metricIdSchema>;

const metricEvidenceSchema = z.object({
  learnerText: z.string().trim().min(1).max(300),
  observation: z.string().trim().min(1).max(240),
  turn: conversationTurnKindSchema,
});

const metricResultSchema = z.object({
  id: metricIdSchema,
  status: z.enum(["assessed", "not_assessed"]),
  band: metricBandSchema.optional(),
  confidence: z.enum(["low", "medium", "high"]),
  evidence: z.array(metricEvidenceSchema).max(2),
  nextSkill: learningSkillSchema.optional(),
  strength: z.string().trim().min(1).max(240).optional(),
  unavailableReason: z.string().trim().min(1).max(240).optional(),
});

export type PictureConversationMetricResult = z.infer<
  typeof metricResultSchema
>;

const metricResultsSchema = z
  .array(metricResultSchema)
  .length(METRIC_IDS.length)
  .superRefine((metrics, context) => {
    const returnedMetricIds = new Set(metrics.map((metric) => metric.id));

    for (const metricId of METRIC_IDS) {
      if (!returnedMetricIds.has(metricId)) {
        context.addIssue({
          code: "custom",
          message: `Missing required metric: ${metricId}.`,
        });
      }
    }
  });

export const METRIC_NEXT_SKILLS = {
  conversation: [
    "answer_expansion",
    "turn_taking",
    "question_forms",
    "detail_expansion",
  ],
  expression: [
    "complete_sentences",
    "sentence_connectors",
    "sentence_variety",
    "narrative_sequence",
    "detail_expansion",
  ],
  grammar: [
    "articles",
    "present_continuous",
    "past_tense",
    "future_forms",
    "subject_verb_agreement",
    "plural_nouns",
    "prepositions",
    "pronouns",
    "question_forms",
  ],
  pronunciation: [
    "sound_articulation",
    "word_stress",
    "sentence_stress_and_intonation",
  ],
  scene_understanding: [
    "scene_detail_noticing",
    "spatial_language",
    "action_relationships",
    "detail_expansion",
  ],
  spoken_fluency: [
    "read_aloud_pacing",
    "pause_chunking",
    "filler_reduction",
    "complete_sentences",
  ],
  vocabulary: [
    "precise_nouns",
    "action_verbs",
    "descriptive_adjectives",
    "descriptive_adverbs",
    "word_variety",
    "topic_vocabulary",
  ],
  writing_conventions: ["spelling", "capitalisation", "punctuation"],
} as const satisfies Record<MetricId, readonly string[]>;

export type AssessableMetricId = Exclude<MetricId, "pronunciation">;

const providerBandSchema = z.enum([...METRIC_BANDS, "not_assessed"]);
const providerEvidenceTurnSchema = z.enum([
  ...conversationTurnKindSchema.options,
  "none",
]);

export function createPictureConversationProviderMetricSchema(
  metricId: AssessableMetricId,
) {
  const nextSkillSchema = z.enum([...METRIC_NEXT_SKILLS[metricId], "none"]);

  return z
    .object({
      band: providerBandSchema,
      confidence: z.enum(["low", "medium", "high"]),
      evidenceQuote: z.string().trim().max(300),
      evidenceTurn: providerEvidenceTurnSchema,
      metricId: z.literal(metricId),
      nextSkill: nextSkillSchema,
      observation: z.string().trim().max(240),
      strength: z.string().trim().max(240),
      unavailableReason: z.string().trim().max(240),
    })
    .superRefine((metric, context) => {
      if (metric.band === "not_assessed") {
        if (!metric.unavailableReason) {
          context.addIssue({
            code: "custom",
            message: "An unavailable reason is required.",
          });
        }
        return;
      }

      if (
        !metric.evidenceQuote ||
        metric.evidenceTurn === "none" ||
        metric.nextSkill === "none" ||
        !metric.observation ||
        !metric.strength
      ) {
        context.addIssue({
          code: "custom",
          message:
            "An assessed metric requires complete evidence and guidance.",
        });
      }
    });
}

export function parsePictureConversationProviderMetric(
  metricId: AssessableMetricId,
  providerMetric: unknown,
): PictureConversationMetricResult {
  const metric =
    createPictureConversationProviderMetricSchema(metricId).parse(
      providerMetric,
    );

  if (metric.band === "not_assessed") {
    return {
      confidence: metric.confidence,
      evidence: [],
      id: metricId,
      status: "not_assessed",
      unavailableReason: metric.unavailableReason,
    };
  }

  const evidenceTurn = conversationTurnKindSchema.parse(metric.evidenceTurn);
  const nextSkill = learningSkillSchema.parse(metric.nextSkill);

  return {
    band: metric.band,
    confidence: metric.confidence,
    evidence: [
      {
        learnerText: metric.evidenceQuote,
        observation: metric.observation,
        turn: evidenceTurn,
      },
    ],
    id: metricId,
    nextSkill,
    status: "assessed",
    strength: metric.strength,
  };
}

export const pictureConversationAssessmentSchema = z.object({
  learnerSummary: z.string().trim().min(1).max(500),
  metrics: metricResultsSchema,
  primaryRecommendation: z.object({
    reason: z.string().trim().min(1).max(300),
    skill: learningSkillSchema,
    track: learningTrackSchema,
  }),
});

export type PictureConversationAssessment = z.infer<
  typeof pictureConversationAssessmentSchema
>;

export const pictureConversationInputSchema = z.object({
  pictureFilename: z.enum([
    "beach.png",
    "classroom.png",
    "market.png",
    "picnic.png",
    "railway.png",
  ]),
  turns: pictureConversationTurnSchema.array().min(1).max(8),
});

export type PictureConversationInput = z.infer<
  typeof pictureConversationInputSchema
>;

export type PictureConversationAssessmentInput = Readonly<{
  pictureDescription: string;
  turns: readonly PictureConversationTurn[];
}>;

export const pictureConversationFeedbackSchema = z.object({
  assessment: pictureConversationAssessmentSchema,
  nextConversationPrompt: z.string().trim().min(1).optional(),
  status: z.literal("assessed"),
});

export const pictureConversationRetrySchema = z.object({
  message: z.string().trim().min(1),
  status: z.literal("retry_later"),
});

export const pictureConversationResponseSchema = z.discriminatedUnion(
  "status",
  [pictureConversationFeedbackSchema, pictureConversationRetrySchema],
);

export type PictureConversationFeedback = z.infer<
  typeof pictureConversationFeedbackSchema
>;

export type PictureConversationResponse = z.infer<
  typeof pictureConversationResponseSchema
>;
