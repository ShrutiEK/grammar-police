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

function isVisualInspectionQuestion(question: string) {
  if (
    /\b(have you|your (?:own )?(?:experience|memory|opinion)|how would you feel|remind you|what would you|advice|learn from)\b/i.test(
      question,
    )
  ) {
    return false;
  }

  return /\b(in (?:the|this) picture|visible|look (?:at|again)|foreground|background|nearby|what (?:is|are) .+ doing|describe .+(?:detail|interaction)|what might happen next with)\b/i.test(
    question,
  );
}

function dependsOnEstablishedExperience(question: string) {
  return /\b(that|this|your) experience\b|\bwhat happened next\b|\bat the time\b|\bmemorable for you\b|\bwho was with you\b/i.test(
    question,
  );
}

function createConversationLadder(
  focusTopic: string,
  hasEstablishedPersonalExperience: boolean,
): QuestionCandidate[] {
  if (hasEstablishedPersonalExperience) {
    return [
      {
        nextQuestion: "What happened next in that experience?",
        nextQuestionType: "personal_follow_up",
      },
      {
        nextQuestion: "How did you feel during that experience, and why?",
        nextQuestionType: "personal_follow_up",
      },
      {
        nextQuestion: "What made that experience memorable for you?",
        nextQuestionType: "personal_follow_up",
      },
      {
        nextQuestion:
          "How was your experience similar to or different from the situation that started our conversation?",
        nextQuestionType: "personal_follow_up",
      },
      {
        nextQuestion: "What did you learn from that experience?",
        nextQuestionType: "personal_follow_up",
      },
      {
        nextQuestion:
          "What advice would you give someone in a similar situation?",
        nextQuestionType: "personal_follow_up",
      },
    ];
  }

  return [
    {
      nextQuestion: `Does ${focusTopic} remind you of a similar experience from your own life? Tell me about it.`,
      nextQuestionType: "personal_follow_up",
    },
    {
      nextQuestion: `If you were involved in ${focusTopic}, how would you feel, and why?`,
      nextQuestionType: "personal_follow_up",
    },
    {
      nextQuestion: `Have you ever seen or experienced something similar to ${focusTopic}? What happened?`,
      nextQuestionType: "personal_follow_up",
    },
    {
      nextQuestion: `Why do you think a situation involving ${focusTopic} could be memorable?`,
      nextQuestionType: "personal_follow_up",
    },
    {
      nextQuestion: `How might different people react to ${focusTopic}?`,
      nextQuestionType: "personal_follow_up",
    },
    {
      nextQuestion: `What could someone learn from a situation involving ${focusTopic}?`,
      nextQuestionType: "personal_follow_up",
    },
    {
      nextQuestion: `What advice would you give someone involved in ${focusTopic}?`,
      nextQuestionType: "personal_follow_up",
    },
    {
      nextQuestion: `Would you like to experience something similar to ${focusTopic}? Why or why not?`,
      nextQuestionType: "personal_follow_up",
    },
  ];
}

function createCorrectivePictureQuestions(
  focusTopic: string,
  sceneFallbackQuestion: string,
): QuestionCandidate[] {
  if (!focusTopic) {
    return [
      {
        nextQuestion: sceneFallbackQuestion,
        nextQuestionType: "picture_follow_up",
      },
      {
        nextQuestion:
          "Let’s return to the picture. What is one clear action you can see?",
        nextQuestionType: "picture_follow_up",
      },
      {
        nextQuestion:
          "Let’s return to the picture. Name one person or object you can clearly see.",
        nextQuestionType: "picture_follow_up",
      },
    ];
  }

  return [
    {
      nextQuestion: `Let’s return to the picture. What is happening with ${focusTopic}?`,
      nextQuestionType: "picture_follow_up",
    },
    {
      nextQuestion: `Look again at ${focusTopic}. What clear detail supports your answer?`,
      nextQuestionType: "picture_follow_up",
    },
  ];
}

function findUnusedCandidate(
  candidates: ReadonlyArray<QuestionCandidate>,
  previousQuestions: ReadonlyArray<string>,
  preferredStartIndex = 0,
) {
  const orderedCandidates = [
    ...candidates.slice(preferredStartIndex),
    ...candidates.slice(0, preferredStartIndex),
  ];

  return orderedCandidates.find(
    (candidate) =>
      !wasQuestionAlreadyAsked(candidate.nextQuestion, previousQuestions),
  );
}

type SelectFollowUpQuestionInput = Readonly<{
  modelQuestion: string;
  modelQuestionType: QuestionType;
  focusTopic: string;
  previousQuestions: ReadonlyArray<string>;
  sceneFallbackQuestion: string;
  allowVisualQuestion: boolean;
  forceConversationProgression: boolean;
  hasEstablishedPersonalExperience: boolean;
}>;

export function selectFollowUpQuestion({
  modelQuestion,
  modelQuestionType,
  focusTopic,
  previousQuestions,
  sceneFallbackQuestion,
  allowVisualQuestion,
  forceConversationProgression,
  hasEstablishedPersonalExperience,
}: SelectFollowUpQuestionInput): QuestionCandidate {
  const modelQuestionIsNew = !wasQuestionAlreadyAsked(
    modelQuestion,
    previousQuestions,
  );
  const modelQuestionIsAllowed =
    modelQuestionIsNew &&
    (!focusTopic || isRelatedToFocus(modelQuestion, focusTopic)) &&
    (allowVisualQuestion || modelQuestionType === "personal_follow_up") &&
    (!forceConversationProgression ||
      (modelQuestionType === "personal_follow_up" &&
        !isVisualInspectionQuestion(modelQuestion) &&
        (hasEstablishedPersonalExperience ||
          !dependsOnEstablishedExperience(modelQuestion))));

  if (modelQuestionIsAllowed) {
    return {
      nextQuestion: modelQuestion,
      nextQuestionType: modelQuestionType,
    };
  }

  if (forceConversationProgression && focusTopic) {
    const conversationLadder = createConversationLadder(
      focusTopic,
      hasEstablishedPersonalExperience,
    );

    return (
      findUnusedCandidate(conversationLadder, previousQuestions) ?? {
        nextQuestion:
          "Is there another experience or viewpoint you would like to share about this topic?",
        nextQuestionType: "personal_follow_up",
      }
    );
  }

  return (
    findUnusedCandidate(
      createCorrectivePictureQuestions(focusTopic, sceneFallbackQuestion),
      previousQuestions,
    ) ?? {
      nextQuestion: sceneFallbackQuestion,
      nextQuestionType: "picture_follow_up",
    }
  );
}
