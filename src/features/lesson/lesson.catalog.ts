import type { LearningSkill } from "./learning-assessment.schema";
import type { PersonalisedLesson } from "./lesson.schema";

type LessonContent = Pick<
  PersonalisedLesson,
  "missionTitle" | "skillLabel" | "teachingTip" | "example" | "rounds"
>;

const skillLabels: Record<LearningSkill, string> = {
  articles: "articles",
  present_continuous: "actions happening now",
  past_tense: "past tense",
  future_forms: "future forms",
  subject_verb_agreement: "subject–verb agreement",
  plural_nouns: "plural nouns",
  prepositions: "position words",
  pronouns: "pronouns",
  question_forms: "question forms",
  precise_nouns: "precise nouns",
  action_verbs: "action verbs",
  descriptive_adjectives: "descriptive adjectives",
  descriptive_adverbs: "descriptive adverbs",
  word_variety: "word variety",
  topic_vocabulary: "topic vocabulary",
  complete_sentences: "complete sentences",
  sentence_connectors: "sentence connectors",
  sentence_variety: "sentence variety",
  narrative_sequence: "story order",
  detail_expansion: "adding useful detail",
  answer_expansion: "expanding answers",
  turn_taking: "conversation turns",
  scene_detail_noticing: "noticing scene details",
  spatial_language: "spatial language",
  action_relationships: "connecting people and actions",
  read_aloud_pacing: "read-aloud pacing",
  pause_chunking: "meaningful pauses",
  filler_reduction: "speaking without fillers",
  sound_articulation: "clear speech sounds",
  word_stress: "word stress",
  sentence_stress_and_intonation: "sentence rhythm and intonation",
  spelling: "spelling",
  capitalisation: "capital letters",
  punctuation: "punctuation",
};

const adjectiveLesson: LessonContent = {
  missionTitle: "Upgrade the Scene!",
  skillLabel: skillLabels.descriptive_adjectives,
  teachingTip:
    "An adjective gives a noun one useful detail. Choose details a listener can picture, such as size, colour, shape, or mood.",
  example: "The kite is flying. → The bright red kite is flying.",
  rounds: [
    {
      id: "adjective-1",
      prompt: "Choose the sentence that paints the clearest picture.",
      choices: [
        "A dog runs.",
        "A playful brown dog runs.",
        "A dog quickly runs.",
      ],
      correctChoice: 1,
      hint: "Look for words that describe the dog itself.",
      successMessage: "Great upgrade — ‘playful’ and ‘brown’ describe the dog!",
    },
    {
      id: "adjective-2",
      prompt: "Which detail best completes: ‘She carries a ___ umbrella’?",
      choices: ["striped", "softly", "carries"],
      correctChoice: 0,
      hint: "The missing word should describe what the umbrella looks like.",
      successMessage: "Exactly — ‘striped’ makes the umbrella easy to imagine.",
    },
    {
      id: "adjective-3",
      prompt: "Pick the strongest final scene description.",
      choices: [
        "There is a market.",
        "There is a busy, colourful market.",
        "There quickly is a market.",
      ],
      correctChoice: 1,
      hint: "Choose two details that naturally describe the market.",
      successMessage:
        "Scene transformed — two precise adjectives added colour and energy!",
    },
  ],
};

const focusedLessons: Partial<Record<LearningSkill, LessonContent>> = {
  descriptive_adjectives: adjectiveLesson,
  articles: {
    missionTitle: "Crack the Article Code!",
    skillLabel: skillLabels.articles,
    teachingTip:
      "Use ‘a’ before a consonant sound, ‘an’ before a vowel sound, and ‘the’ for a specific thing your listener can identify.",
    example: "I see a kite. The kite is red. An excited child is holding it.",
    rounds: [
      {
        id: "article-1",
        prompt: "Choose: ‘I can see ___ orange kite.’",
        choices: ["a", "an", "the"],
        correctChoice: 1,
        hint: "Listen to the first sound in ‘orange’. Love vowels?",
        successMessage:
          "Nice choice — ‘orange’ begins with a vowel sound, so use ‘an’.",
      },
      {
        id: "article-2",
        prompt: "You already mentioned a dog. Choose: ‘___ dog is running.’",
        choices: ["A", "An", "The"],
        correctChoice: 2,
        hint: "Your listener already knows which dog you mean.",
        successMessage: "Yes — ‘the’ points back to the specific dog.",
      },
      {
        id: "article-3",
        prompt: "Choose: ‘There is ___ child near the tree.’",
        choices: ["a", "an", "the"],
        correctChoice: 0,
        hint: "This is the first mention of one child.",
        successMessage: "You cracked it — use ‘a’ for the first mention here.",
      },
    ],
  },
  present_continuous: {
    missionTitle: "Action Reporter!",
    skillLabel: skillLabels.present_continuous,
    teachingTip:
      "For an action happening now, use am/is/are + a verb ending in -ing.",
    example: "The children play. → The children are playing.",
    rounds: [
      {
        id: "continuous-1",
        prompt: "Report what is happening now.",
        choices: ["She is run.", "She running.", "She is running."],
        correctChoice: 2,
        hint: "You need both ‘is’ and a verb ending in -ing.",
        successMessage: "Live report complete: ‘She is running.’",
      },
      {
        id: "continuous-2",
        prompt: "Choose the best action sentence.",
        choices: ["They are eating.", "They is eating.", "They eating."],
        correctChoice: 0,
        hint: "Use ‘are’ with ‘they’.",
        successMessage: "Exactly — ‘They are eating.’",
      },
      {
        id: "continuous-3",
        prompt: "Complete: ‘I ___ looking at the picture.’",
        choices: ["is", "am", "are"],
        correctChoice: 1,
        hint: "Which helper verb travels with ‘I’?",
        successMessage:
          "Nice choice — ‘I am looking’ describes the action now.",
      },
    ],
  },
  prepositions: {
    missionTitle: "Scene Navigator!",
    skillLabel: skillLabels.prepositions,
    teachingTip:
      "Position words show where things are: in, on, under, beside, between, and behind.",
    example: "The bag is under the table.",
    rounds: [
      {
        id: "position-1",
        prompt: "The bird is ___ the branch.",
        choices: ["on", "between", "inside"],
        correctChoice: 0,
        hint: "The bird is resting on top of the branch.",
        successMessage: "Right — the bird is ‘on’ the branch.",
      },
      {
        id: "position-2",
        prompt: "The ball is ___ the two children.",
        choices: ["under", "between", "behind"],
        correctChoice: 1,
        hint: "There is one child on each side.",
        successMessage: "Perfect — ‘between’ connects all three positions.",
      },
      {
        id: "position-3",
        prompt: "The bicycle is ___ the wall, not in front of it.",
        choices: ["behind", "on", "between"],
        correctChoice: 0,
        hint: "It is hidden by the wall.",
        successMessage: "Navigation complete — it is ‘behind’ the wall.",
      },
    ],
  },
  sentence_connectors: {
    missionTitle: "Sentence Bridge Builder!",
    skillLabel: skillLabels.sentence_connectors,
    teachingTip:
      "Connect related ideas with words such as and, but, because, and so.",
    example: "It started raining, so we opened an umbrella.",
    rounds: [
      {
        id: "connector-1",
        prompt: "I wore a coat ___ it was cold.",
        choices: ["because", "but", "and"],
        correctChoice: 0,
        hint: "The second idea gives a reason.",
        successMessage: "Strong bridge — ‘because’ introduces the reason.",
      },
      {
        id: "connector-2",
        prompt: "The sun was bright, ___ we stayed in the shade.",
        choices: ["because", "so", "and"],
        correctChoice: 1,
        hint: "The shade is the result.",
        successMessage: "Nice choice — ‘so’ links the cause to its result.",
      },
      {
        id: "connector-3",
        prompt: "The dog is small ___ very brave.",
        choices: ["but", "because", "so"],
        correctChoice: 0,
        hint: "The two details contrast with each other.",
        successMessage: "Bridge built — ‘but’ shows the contrast.",
      },
    ],
  },
};

export function getLessonContent(skill: LearningSkill): LessonContent {
  const focusedLesson = focusedLessons[skill];
  if (focusedLesson) return focusedLesson;

  const skillLabel = skillLabels[skill];
  return {
    missionTitle: `Power Up: ${toTitleCase(skillLabel)}!`,
    skillLabel,
    teachingTip: `Build confidence with ${skillLabel} by choosing the clearest, most natural English for the situation.`,
    example: `Small changes in ${skillLabel} can make an idea clearer and easier to follow.`,
    rounds: [1, 2, 3].map((round) => ({
      id: `${skill}-${round}`,
      prompt: `Round ${round}: Which choice gives the clearest practice with ${skillLabel}?`,
      choices: [
        `Use ${skillLabel} to make the idea precise.`,
        "Add words without checking their meaning.",
        "Leave the idea unfinished.",
      ],
      correctChoice: 0,
      hint: `Choose the option that uses ${skillLabel} for a clear purpose.`,
      successMessage: `Nice choice — that is purposeful ${skillLabel} practice.`,
    })),
  };
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
