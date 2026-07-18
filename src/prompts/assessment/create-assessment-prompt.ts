type AssessmentPromptInput = Readonly<{
  pictureDescription: string;
  transcript: string;
}>;

export function createAssessmentPrompt({
  pictureDescription,
  transcript,
}: AssessmentPromptInput) {
  return `You are an elementary English evaluator. The child is looking at a picture of "${pictureDescription}". Evaluate this transcript of the child describing the picture: "${transcript}" Return a JSON object EXACTLY like this (and nothing else): { "grammar_score": 85, "vocabulary_score": 90, "communication_score": 80, "pronunciation_score": 75, "grammatical_errors": ["List structural errors, like missing articles (a/an/the) or wrong verb tenses"], "vocabulary_errors": ["List factual errors. If they describe things not in the picture (like a dog, a car, or an apple), flag it here."], "mastered_skills": ["List what they did well (e.g., 'Correctly identified the people')"], "child_friendly_feedback": "A warm, encouraging 1-sentence feedback. If they described the wrong thing, gently correct them." }

Make sure to grade:
- "grammar_score" (0 to 100): accuracy of verb forms, plurals, prepositions, articles.
- "vocabulary_score" (0 to 100): correct vocabulary matching the picture, richness of nouns/adjectives.
- "communication_score" (0 to 100): clarity of message, story flow, context alignment.
- "pronunciation_score" (0 to 100): estimated speaking clarity/pronunciation flow based on the transcription output structure and word spelling/fillers.`;
}
