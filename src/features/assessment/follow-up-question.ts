import type { QuestionType } from "./assessment.schema";

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

type QuestionCandidate = Readonly<{
  nextQuestion: string;
  nextQuestionType: QuestionType;
}>;

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

function createTopicFallbacks(focusTopic: string): QuestionCandidate[] {
  return [
    {
      nextQuestion: `What visible detail about ${focusTopic} have you not described yet?`,
      nextQuestionType: "picture_follow_up",
    },
    {
      nextQuestion: `What do you think is happening with ${focusTopic}, and why?`,
      nextQuestionType: "picture_follow_up",
    },
    {
      nextQuestion: `What might happen next with ${focusTopic}?`,
      nextQuestionType: "picture_follow_up",
    },
    {
      nextQuestion: `Where is ${focusTopic} in the picture, and what is nearby?`,
      nextQuestionType: "picture_follow_up",
    },
    {
      nextQuestion: `How would you describe ${focusTopic} to someone who cannot see the picture?`,
      nextQuestionType: "picture_follow_up",
    },
    {
      nextQuestion: `What does ${focusTopic} make you think or feel?`,
      nextQuestionType: "personal_follow_up",
    },
    {
      nextQuestion: `Have you seen something like ${focusTopic} before? Tell me about it.`,
      nextQuestionType: "personal_follow_up",
    },
  ];
}

type SelectFollowUpQuestionInput = Readonly<{
  modelQuestion: string;
  modelQuestionType: QuestionType;
  focusTopic: string;
  previousQuestions: ReadonlyArray<string>;
  sceneFallbackQuestion: string;
}>;

export function selectFollowUpQuestion({
  modelQuestion,
  modelQuestionType,
  focusTopic,
  previousQuestions,
  sceneFallbackQuestion,
}: SelectFollowUpQuestionInput): QuestionCandidate {
  const modelQuestionIsNew = !wasQuestionAlreadyAsked(
    modelQuestion,
    previousQuestions,
  );

  if (
    modelQuestionIsNew &&
    (!focusTopic || isRelatedToFocus(modelQuestion, focusTopic))
  ) {
    return {
      nextQuestion: modelQuestion,
      nextQuestionType: modelQuestionType,
    };
  }

  const fallbackCandidates: QuestionCandidate[] = focusTopic
    ? createTopicFallbacks(focusTopic)
    : [
        {
          nextQuestion: sceneFallbackQuestion,
          nextQuestionType: "picture_follow_up",
        },
        {
          nextQuestion:
            "Choose one real person in the picture. What are they doing?",
          nextQuestionType: "picture_follow_up",
        },
        {
          nextQuestion:
            "Choose one visible activity that you have not mentioned yet and describe it.",
          nextQuestionType: "picture_follow_up",
        },
        {
          nextQuestion:
            "What is one real detail in the foreground that you have not described?",
          nextQuestionType: "picture_follow_up",
        },
      ];

  return (
    fallbackCandidates.find(
      (candidate) =>
        !wasQuestionAlreadyAsked(candidate.nextQuestion, previousQuestions),
    ) ?? {
      nextQuestion: `What new detail can you add to answer question ${previousQuestions.length + 1}?`,
      nextQuestionType: "picture_follow_up",
    }
  );
}
