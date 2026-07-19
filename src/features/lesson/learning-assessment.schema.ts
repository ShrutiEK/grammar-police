import { z } from "zod";

export const learningSkillSchema = z.enum([
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
]);

export const learningTrackSchema = z.enum([
  "grammar",
  "vocabulary",
  "expression",
  "conversation",
  "scene_description",
  "spoken_fluency",
  "pronunciation",
  "writing_conventions",
]);

export const metricIdSchema = z.enum([
  "scene_understanding",
  "grammar",
  "vocabulary",
  "expression",
  "conversation",
  "writing_conventions",
  "spoken_fluency",
  "pronunciation",
]);

export const metricBandSchema = z.enum([
  "emerging",
  "developing",
  "secure",
  "strong",
]);

const evidenceSchema = z.object({
  turn: z.enum([
    "scene_description",
    "picture_follow_up",
    "personal_follow_up",
    "unknown",
  ]),
  correctedText: z.string().trim().min(1).optional(),
  learnerText: z.string().trim().min(1),
  observation: z.string().trim().min(1),
});

export const metricResultSchema = z
  .object({
    id: metricIdSchema,
    status: z.enum(["assessed", "not_assessed"]),
    band: metricBandSchema.optional(),
    confidence: z.enum(["low", "medium", "high"]),
    evidence: z.array(evidenceSchema),
    strength: z.string().trim().min(1).optional(),
    nextSkill: learningSkillSchema.optional(),
    unavailableReason: z.string().trim().min(1).optional(),
  })
  .superRefine((metric, context) => {
    if (metric.status === "assessed" && !metric.band) {
      context.addIssue({
        code: "custom",
        message: "An assessed metric requires a band.",
        path: ["band"],
      });
    }

    if (metric.status === "not_assessed" && !metric.unavailableReason) {
      context.addIssue({
        code: "custom",
        message: "A metric needing more evidence requires a reason.",
        path: ["unavailableReason"],
      });
    }
  });

export const pictureConversationAssessmentSchema = z.object({
  metrics: z.array(metricResultSchema).min(1),
  primaryRecommendation: z
    .object({
      track: learningTrackSchema,
      skill: learningSkillSchema,
      reason: z.string().trim().min(1),
    })
    .optional(),
  learnerSummary: z.string().trim().min(1),
});

export type LearningSkill = z.infer<typeof learningSkillSchema>;
export type LearningTrack = z.infer<typeof learningTrackSchema>;
export type MetricBand = z.infer<typeof metricBandSchema>;
export type MetricResult = z.infer<typeof metricResultSchema>;
export type PictureConversationAssessment = z.infer<
  typeof pictureConversationAssessmentSchema
>;
