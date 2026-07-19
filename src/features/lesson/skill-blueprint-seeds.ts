import type { ExerciseType } from "./adaptive-exercise.schema";
import type { LearningSkill } from "./learning-assessment.schema";

export type SupportedSkillBlueprintSeed = Readonly<{
  supported: true;
  goal: string;
  misconception: string;
  allowedExerciseTypes: ExerciseType[];
  goodExample: string;
}>;

type UnsupportedSkillBlueprintSeed = Readonly<{
  supported: false;
  reason: string;
}>;

export type SkillBlueprintSeed =
  SupportedSkillBlueprintSeed | UnsupportedSkillBlueprintSeed;

const fillOrCorrect: ExerciseType[] = ["fill_blank", "correct_sentence"];
const wordChoice: ExerciseType[] = ["fill_blank", "choose_precise_word"];
const responseChoice: ExerciseType[] = ["choose_best_response"];
const sentenceChoice: ExerciseType[] = [
  "correct_sentence",
  "choose_best_response",
];

function supported(
  goal: string,
  misconception: string,
  goodExample: string,
  allowedExerciseTypes: ExerciseType[] = fillOrCorrect,
): SupportedSkillBlueprintSeed {
  return {
    supported: true,
    goal,
    misconception,
    allowedExerciseTypes,
    goodExample,
  };
}

const pronunciationUnavailable: UnsupportedSkillBlueprintSeed = {
  supported: false,
  reason:
    "Pronunciation practice requires an audio-aware activity and is coming soon.",
};

export const skillBlueprintSeeds = {
  articles: supported(
    "Choose a, an, the, or no article accurately.",
    "Omitting an article before a singular countable noun.",
    '"We saw ___ elephant." → "an"',
  ),
  present_continuous: supported(
    "Use am, is, or are with an -ing verb for actions happening now.",
    "Omitting the helper verb or using the base verb.",
    '"They ___ eating now." → "are"',
  ),
  past_tense: supported(
    "Use regular and common irregular past-tense verbs.",
    "Using the present form for a completed past action.",
    '"Yesterday, Mina ___ home." → "walked"',
  ),
  future_forms: supported(
    "Choose will or be going to for a clear future meaning.",
    "Using a present or past form for a future plan or prediction.",
    '"We are ___ visit Delhi tomorrow." → "going to"',
  ),
  subject_verb_agreement: supported(
    "Match present-tense verbs with singular and plural subjects.",
    "Using a plural verb form with a singular subject or the reverse.",
    '"The boy ___ every morning." → "runs"',
  ),
  plural_nouns: supported(
    "Form regular and common irregular plural nouns.",
    "Using a singular noun after a number greater than one.",
    '"Three ___ are waiting." → "children"',
    wordChoice,
  ),
  prepositions: supported(
    "Choose position and movement words from explicit sentence context.",
    "Choosing a location word that conflicts with the stated relationship.",
    '"The keys are ___ the drawer." → "inside"',
    wordChoice,
  ),
  pronouns: supported(
    "Replace nouns with clear subject, object, or possessive pronouns.",
    "Using a pronoun that does not match or clearly refer to its noun.",
    '"Ravi found the ball. ___ picked it up." → "He"',
  ),
  question_forms: supported(
    "Build questions with correct word order and helper verbs.",
    "Keeping statement word order inside a question.",
    '"Where ___ she live?" → "does"',
  ),
  precise_nouns: supported(
    "Replace vague nouns with specific, useful nouns.",
    "Choosing a broad word when the sentence provides a precise meaning.",
    '"The doctor used a ___." → "stethoscope"',
    wordChoice,
  ),
  action_verbs: supported(
    "Choose vivid verbs that accurately name an action.",
    "Using a vague verb such as do or go when a precise action is clear.",
    '"The rabbit ___ across the field." → "hopped"',
    wordChoice,
  ),
  descriptive_adjectives: supported(
    "Choose useful adjectives that describe nouns precisely.",
    "Confusing adjectives with adverbs or verbs.",
    '"Maya carried a ___ umbrella." → "striped"',
    ["fill_blank", "choose_precise_word", "correct_sentence"],
  ),
  descriptive_adverbs: supported(
    "Choose adverbs that clearly describe how an action happens.",
    "Using an adjective where an adverb should modify a verb.",
    '"The singer performed ___." → "beautifully"',
    wordChoice,
  ),
  word_variety: supported(
    "Replace repeated words with natural alternatives.",
    "Changing a repeated word to a synonym that does not fit the context.",
    '"The meal was good; the dessert was ___." → "delicious"',
    wordChoice,
  ),
  topic_vocabulary: supported(
    "Use accurate words for the stated everyday topic.",
    "Choosing a familiar word that is unrelated to the named topic.",
    '"A train stops at a ___." → "station"',
    wordChoice,
  ),
  complete_sentences: supported(
    "Recognise and build sentences with a complete subject and idea.",
    "Treating a fragment as a complete sentence.",
    'Choose the complete sentence → "The children played outside."',
    sentenceChoice,
  ),
  sentence_connectors: supported(
    "Connect ideas using words that express addition, contrast, reason, or result.",
    "Confusing because with so or using and for every relationship.",
    '"I wore a coat ___ it was cold." → "because"',
    ["fill_blank", "join_ideas"],
  ),
  sentence_variety: supported(
    "Vary sentence openings and structures without changing meaning.",
    "Creating variety by adding unnecessary or unnatural words.",
    'Choose the smoother variation → "After lunch, we walked home."',
    sentenceChoice,
  ),
  narrative_sequence: supported(
    "Place events in a clear beginning, middle, and end order.",
    "Choosing a sequence marker that conflicts with event order.",
    '"First we mixed the flour; ___, we baked it." → "then"',
    ["fill_blank", "join_ideas"],
  ),
  detail_expansion: supported(
    "Add one relevant detail that makes an idea clearer.",
    "Adding unrelated information instead of developing the main idea.",
    'Best expansion of "I saw a bird." → "I saw a blue bird on the fence."',
    responseChoice,
  ),
  answer_expansion: supported(
    "Extend a short answer with a relevant reason, detail, or example.",
    "Repeating the original answer without adding useful information.",
    'Best answer to "Do you like reading?" → "Yes, because stories help me relax."',
    responseChoice,
  ),
  turn_taking: supported(
    "Choose responses that acknowledge the speaker and continue the conversation.",
    "Ignoring the question or abruptly changing the topic.",
    'Best reply to "What sport do you play?" → "I play football. What do you play?"',
    responseChoice,
  ),
  scene_detail_noticing: supported(
    "Practise selecting specific details from a complete written description.",
    "Inventing a detail not stated in the provided sentence.",
    '"A red bus stopped beside the school." Which detail is stated? → "red bus"',
    responseChoice,
  ),
  spatial_language: supported(
    "Express where things are using explicit spatial relationships.",
    "Using a spatial word that reverses the stated relationship.",
    '"The lamp hangs ___ the table." → "above"',
    wordChoice,
  ),
  action_relationships: supported(
    "Describe clearly who performs an action and what it affects.",
    "Pairing an action with the wrong person or object.",
    '"Nina throws the ball to Omar." Who receives it? → "Omar"',
    responseChoice,
  ),
  read_aloud_pacing: supported(
    "Recognise text grouping that supports a steady read-aloud pace.",
    "Reading every word as one unbroken group or pausing after every word.",
    'Best reading groups → "After dinner / we played a game."',
    responseChoice,
  ),
  pause_chunking: supported(
    "Choose meaningful phrase boundaries for guided spoken rehearsal.",
    "Placing pauses inside a phrase that belongs together.",
    'Best pause placement → "In the morning / we caught the bus."',
    responseChoice,
  ),
  filler_reduction: supported(
    "Choose a clear spoken response without unnecessary fillers.",
    "Replacing fillers by rushing or removing meaningful content.",
    'Clearer response → "I would choose the blue one because it is sturdy."',
    responseChoice,
  ),
  sound_articulation: pronunciationUnavailable,
  word_stress: pronunciationUnavailable,
  sentence_stress_and_intonation: pronunciationUnavailable,
  spelling: supported(
    "Choose the correct spelling of familiar words.",
    "Selecting a spelling that matches sound but not standard written English.",
    '"Which spelling is correct?" → "beautiful"',
    wordChoice,
  ),
  capitalisation: supported(
    "Use capital letters for sentence starts and proper nouns.",
    "Capitalising common nouns or leaving names lowercase.",
    'Correct sentence → "Asha lives in Mumbai."',
    sentenceChoice,
  ),
  punctuation: supported(
    "Choose punctuation that matches sentence meaning and structure.",
    "Using a full stop for every sentence type or omitting needed punctuation.",
    '"Where are you going___" → "?"',
    wordChoice,
  ),
} satisfies Record<LearningSkill, SkillBlueprintSeed>;

export function isLessonSkillSupported(skill: LearningSkill) {
  return skillBlueprintSeeds[skill].supported;
}
