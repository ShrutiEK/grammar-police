import {
  METRIC_BANDS,
  METRIC_NEXT_SKILLS,
  type AssessableMetricId,
  type PictureConversationAssessmentInput,
  type PictureConversationTurn,
} from "@/features/assessment/picture-conversation.schema";

const metricGuidance = {
  conversation:
    "Assess whether personal follow-up answers address the question, add relevant detail, and sustain the idea.",
  expression:
    "Assess complete ideas, connected sentences, clarity, development, and useful detail. Do not assess accent or formatting.",
  grammar:
    "Assess sentence formation, verbs, articles, plurals, agreement, prepositions, pronouns, and question forms.",
  scene_understanding:
    "Assess visible people, objects, actions, and relationships against the trusted picture description. Do not use personal answers as scene evidence.",
  spoken_fluency:
    "Assess speaking flow from transcript length and reliable recording duration: pace, fillers visible in the transcript, and completion of ideas. Do not assess pronunciation or pauses without timestamps.",
  vocabulary:
    "Assess relevant and precise nouns, verbs, adjectives, adverbs, topic vocabulary, and useful word variety.",
  writing_conventions:
    "Assess spelling, capitalisation, and punctuation only from learner-entered written answers.",
} as const satisfies Record<AssessableMetricId, string>;

function selectMetricTurns(
  metricId: AssessableMetricId,
  turns: readonly PictureConversationTurn[],
) {
  const EnglishTurns = turns.filter(
    (turn) => !turn.languageWarning && turn.isRelevantToFocus,
  );

  if (metricId === "scene_understanding") {
    return EnglishTurns.filter((turn) =>
      ["scene_description", "picture_follow_up"].includes(turn.kind),
    );
  }

  if (metricId === "conversation") {
    return EnglishTurns.filter((turn) => turn.kind === "personal_follow_up");
  }

  if (metricId === "writing_conventions") {
    return EnglishTurns.filter((turn) => turn.answerMode === "written");
  }

  if (metricId === "spoken_fluency") {
    return EnglishTurns.filter((turn) => turn.answerMode === "spoken");
  }

  return EnglishTurns;
}

function countWords(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function countFillers(value: string) {
  return value.match(/\b(?:erm|hmm|like|uh|um|you know)\b/giu)?.length ?? 0;
}

function createSpokenFluencySignals(turns: readonly PictureConversationTurn[]) {
  return turns
    .filter(
      (
        turn,
      ): turn is PictureConversationTurn & {
        audioDurationInSeconds: number;
      } =>
        turn.answerMode === "spoken" &&
        typeof turn.audioDurationInSeconds === "number",
    )
    .map((turn) => {
      const wordCount = countWords(turn.responseText);

      return {
        durationInSeconds: turn.audioDurationInSeconds,
        fillerCount: countFillers(turn.responseText),
        turn: turn.kind,
        wordCount,
        wordsPerMinute: Math.round(
          (wordCount / turn.audioDurationInSeconds) * 60,
        ),
      };
    });
}

export function createPictureConversationPrompt(
  metricId: AssessableMetricId,
  { pictureDescription, turns }: PictureConversationAssessmentInput,
) {
  const metricTurns = selectMetricTurns(metricId, turns);
  const sceneContext =
    metricId === "scene_understanding"
      ? `Trusted picture description: ${pictureDescription}`
      : "The picture description is intentionally omitted because this metric does not require scene verification.";
  const spokenSignals =
    metricId === "spoken_fluency"
      ? `Spoken timing signals: ${JSON.stringify(createSpokenFluencySignals(metricTurns))}`
      : "";

  return `You are a supportive English tutor assessing exactly one metric from an English picture conversation.

Metric to assess: ${metricId}
Metric guidance: ${metricGuidance[metricId]}
${sceneContext}
Relevant conversation turns: ${JSON.stringify(metricTurns)}
${spokenSignals}

Return one compact JSON object matching the supplied schema. Do not return Markdown, additional metrics, or additional properties.
Use only these assessed bands: ${JSON.stringify(METRIC_BANDS)}.
Use only these next skills for this metric: ${JSON.stringify(METRIC_NEXT_SKILLS[metricId])}.

Every field is required.
- metricId must be ${metricId}.
- When there is enough reliable evidence, use an assessed band and fill evidenceQuote, evidenceTurn, observation, nextSkill, and strength. Set unavailableReason to an empty string.
- When evidence is insufficient, set band to not_assessed, nextSkill and evidenceTurn to none, leave evidenceQuote, observation, and strength empty, and give a brief unavailableReason.
- evidenceQuote must be a short exact quote from the learner.
- observation and strength must be kind, specific, and no more than 20 words each.
- Do not treat non-English content as weak English.
- Assess observable communication only, never personality or intelligence.
- Keep all generated text in English and age-neutral.`;
}
