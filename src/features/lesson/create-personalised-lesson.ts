import type {
  LearningSkill,
  MetricResult,
  PictureConversationAssessment,
} from "./learning-assessment.schema";
import { pictureConversationAssessmentSchema } from "./learning-assessment.schema";
import { getLessonContent } from "./lesson.catalog";
import { isLessonSkillSupported } from "./skill-blueprint-seeds";
import {
  personalisedLessonSchema,
  type PersonalisedLesson,
} from "./lesson.schema";

const bandPriority = {
  emerging: 0,
  developing: 1,
  secure: 2,
  strong: 3,
} as const;
const metricPriority = [
  "grammar",
  "vocabulary",
  "expression",
  "conversation",
  "scene_understanding",
  "spoken_fluency",
  "pronunciation",
  "writing_conventions",
] as const;

export function createPersonalisedLesson(input: unknown): PersonalisedLesson {
  const assessment = pictureConversationAssessmentSchema.parse(input);
  const supportingMetric = findSupportingMetric(assessment);
  const skill = supportingMetric.nextSkill as LearningSkill;
  const content = getLessonContent(skill);
  const evidence = supportingMetric.evidence[0];

  return personalisedLessonSchema.parse({
    ...content,
    track:
      assessment.primaryRecommendation.skill === skill
        ? assessment.primaryRecommendation.track
        : trackForMetric(supportingMetric.id),
    skill,
    reason:
      assessment.primaryRecommendation.skill === skill
        ? assessment.primaryRecommendation.reason
        : (evidence?.observation ??
          "This is the clearest assessed skill to practise next."),
    learnerEvidence:
      evidence?.learnerText ??
      supportingMetric.strength ??
      assessment.learnerSummary,
    observation:
      evidence?.observation ??
      "This is the clearest assessed skill to practise next.",
    startingBand: supportingMetric.band,
    successCriteria:
      "Win 2 of 3 rounds. A hint and retry are always available.",
  });
}

function findSupportingMetric(
  assessment: PictureConversationAssessment,
): MetricResult & {
  nextSkill: LearningSkill;
  band: NonNullable<MetricResult["band"]>;
} {
  const recommended = assessment.metrics.find(
    (metric) =>
      metric.status === "assessed" &&
      metric.nextSkill === assessment.primaryRecommendation.skill &&
      isLessonSkillSupported(metric.nextSkill) &&
      metric.evidence.length > 0,
  );
  if (recommended?.nextSkill && recommended.band)
    return recommended as MetricResult & {
      nextSkill: LearningSkill;
      band: NonNullable<MetricResult["band"]>;
    };

  const candidates = assessment.metrics
    .filter(
      (
        metric,
      ): metric is MetricResult & {
        nextSkill: LearningSkill;
        band: keyof typeof bandPriority;
      } =>
        metric.status === "assessed" &&
        Boolean(metric.band) &&
        metric.nextSkill !== undefined &&
        isLessonSkillSupported(metric.nextSkill) &&
        metric.evidence.length > 0,
    )
    .sort((left, right) => {
      const bandDifference = bandPriority[left.band] - bandPriority[right.band];
      if (bandDifference !== 0) return bandDifference;
      return metricPriority.indexOf(left.id) - metricPriority.indexOf(right.id);
    });

  const fallback = candidates[0];
  if (!fallback)
    throw new Error(
      "A lesson requires an assessed, evidence-backed next skill.",
    );
  return fallback;
}

function trackForMetric(metricId: MetricResult["id"]) {
  if (metricId === "scene_understanding") return "scene_description" as const;
  return metricId;
}

export function evaluateLessonChoice(
  lesson: PersonalisedLesson,
  roundIndex: number,
  choiceIndex: number,
) {
  const round = lesson.rounds[roundIndex];
  if (!round) throw new Error("That lesson round does not exist.");
  const isCorrect = round.correctChoice === choiceIndex;
  return { isCorrect, message: isCorrect ? round.successMessage : round.hint };
}
