import type { PictureConversationMetricResult } from "./picture-conversation.schema";

const articles = ["a", "an", "the"] as const;

function countArticleForms(value: string) {
  const words = value.toLocaleLowerCase("en").match(/\p{L}+/gu) ?? [];

  return articles.map(
    (article) => words.filter((word) => word === article).length,
  );
}

export function validateMetricFinding(metric: PictureConversationMetricResult) {
  if (metric.nextSkill !== "articles") {
    return metric;
  }

  const evidence = metric.evidence[0];
  const correctedText = evidence?.correctedText;

  if (!evidence || !correctedText) {
    throw new Error(
      "An articles recommendation requires learner text and a correction.",
    );
  }

  const learnerArticleCounts = countArticleForms(evidence.learnerText);
  const correctedArticleCounts = countArticleForms(correctedText);
  const changesAnArticleDecision = articles.some(
    (_article, index) =>
      learnerArticleCounts[index] !== correctedArticleCounts[index],
  );

  if (!changesAnArticleDecision) {
    throw new Error(
      "An articles recommendation must change a, an, or the in the corrected example.",
    );
  }

  return metric;
}
