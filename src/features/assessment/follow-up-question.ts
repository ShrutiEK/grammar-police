const contextualPronouns = new Set([
  "he",
  "her",
  "him",
  "it",
  "she",
  "that",
  "their",
  "them",
  "they",
  "this",
  "those",
]);

const ignoredWords = new Set([
  "about",
  "could",
  "describe",
  "does",
  "doing",
  "from",
  "have",
  "might",
  "notice",
  "please",
  "question",
  "tell",
  "that",
  "their",
  "there",
  "these",
  "they",
  "think",
  "this",
  "what",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

function getWords(text: string) {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}

function normalizeQuestion(question: string) {
  return getWords(question).join(" ");
}

function getMeaningfulWords(question: string) {
  return new Set(
    getWords(question).filter(
      (word) => word.length > 2 && !ignoredWords.has(word),
    ),
  );
}

function questionsAreTooSimilar(first: string, second: string) {
  if (normalizeQuestion(first) === normalizeQuestion(second)) {
    return true;
  }

  const firstWords = getMeaningfulWords(first);
  const secondWords = getMeaningfulWords(second);

  if (firstWords.size === 0 || secondWords.size === 0) {
    return false;
  }

  const sharedWordCount = [...firstWords].filter((word) =>
    secondWords.has(word),
  ).length;
  const smallerQuestionSize = Math.min(firstWords.size, secondWords.size);

  return sharedWordCount / smallerQuestionSize >= 0.8;
}

function wasQuestionAlreadyAsked(
  candidate: string,
  previousQuestions: ReadonlyArray<string>,
) {
  return previousQuestions.some((question) =>
    questionsAreTooSimilar(candidate, question),
  );
}

function isRelatedToFocus(question: string, focusTopic: string) {
  const questionWords = new Set(getWords(question));
  const meaningfulFocusWords = getWords(focusTopic).filter(
    (word) => word.length > 3 && !ignoredWords.has(word),
  );

  return (
    meaningfulFocusWords.some((word) => questionWords.has(word)) ||
    [...questionWords].some((word) => contextualPronouns.has(word))
  );
}

function createTopicFallbacks(focusTopic: string) {
  return [
    `What visible detail about ${focusTopic} have you not described yet?`,
    `What do you think is happening with ${focusTopic}, and why?`,
    `What might happen next with ${focusTopic}?`,
    `Where is ${focusTopic} in the picture, and what is nearby?`,
    `How would you describe ${focusTopic} to someone who cannot see the picture?`,
    `What does ${focusTopic} make you think or feel?`,
    `Have you seen something like ${focusTopic} before? Tell me about it.`,
  ];
}

type SelectFollowUpQuestionInput = Readonly<{
  modelQuestion: string;
  focusTopic: string;
  previousQuestions: ReadonlyArray<string>;
  sceneFallbackQuestion: string;
}>;

export function selectFollowUpQuestion({
  modelQuestion,
  focusTopic,
  previousQuestions,
  sceneFallbackQuestion,
}: SelectFollowUpQuestionInput) {
  const modelQuestionIsNew = !wasQuestionAlreadyAsked(
    modelQuestion,
    previousQuestions,
  );

  if (
    modelQuestionIsNew &&
    (!focusTopic || isRelatedToFocus(modelQuestion, focusTopic))
  ) {
    return modelQuestion;
  }

  const fallbackCandidates = focusTopic
    ? createTopicFallbacks(focusTopic)
    : [
        sceneFallbackQuestion,
        "Choose one real person in the picture. What are they doing?",
        "Choose one visible activity that you have not mentioned yet and describe it.",
        "What is one real detail in the foreground that you have not described?",
      ];

  return (
    fallbackCandidates.find(
      (candidate) => !wasQuestionAlreadyAsked(candidate, previousQuestions),
    ) ??
    `What new detail can you add to answer question ${previousQuestions.length + 1}?`
  );
}
