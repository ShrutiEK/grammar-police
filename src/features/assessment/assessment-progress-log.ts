type AssessmentProgressDetails = Readonly<Record<string, unknown>>;

export function logAssessmentProgress(
  step: string,
  details?: AssessmentProgressDetails,
) {
  if (details) {
    console.info(`[assessment-progress] ${step}`, details);
    return;
  }

  console.info(`[assessment-progress] ${step}`);
}
