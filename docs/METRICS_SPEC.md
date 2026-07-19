# Picture conversation metrics specification

This specification defines the first assessment engine for Grammar Police. It
covers English-only picture conversations supplied by the conversation feature.
It is an implementation contract for schemas, provider adapters, prompts,
tests, and learner-facing feedback.

## Scope

One assessment attempt contains two turns:

1. **Scene description:** the learner describes a picture.
2. **Personal follow-up:** the learner answers one open-ended question related
   to a supported detail they mentioned.

The first turn assesses scene description; the second assesses conversation.
The system produces one combined assessment from the turns available. It shows
partial feedback when some areas need more evidence.

The system supports two response modes:

- `written`: learner-entered English text supplied by the conversation feature.
- `verbal`: a spoken-response transcript and any reliable audio metadata
  supplied by the conversation feature.

## Assessment principles

- Assess observable evidence, not an assumed learner ability or personality.
- Use the learner's age band when it is available. Until age capture exists,
  avoid claiming that content or assessment is personalised by age.
- Do not present a CEFR level from one short attempt. CEFR-aligned descriptors
  inform the rubric; a level estimate requires evidence across several
  activities.
- Keep feedback supportive, concrete, brief, and English-only.
- Use a curated scene inventory as the authoritative source for picture facts.
  Do not reject an unlisted detail as incorrect merely because it is absent from
  a generic scene summary.
- Every assessed metric requires learner-safe evidence. A metric without enough
  evidence is `not_assessed`, never a low score.
- Do not expose provider reasoning or raw errors to the learner.

## Metric bands

All assessed metrics use one of four bands:

| Band         | Meaning                                                            |
| ------------ | ------------------------------------------------------------------ |
| `emerging`   | The learner is beginning this skill and needs guided practice.     |
| `developing` | The learner demonstrates the skill sometimes but needs support.    |
| `secure`     | The learner uses the skill reliably for this activity.             |
| `strong`     | The learner uses the skill clearly and flexibly for this activity. |

`not_assessed` means there was insufficient or unreliable evidence. It must not
be rendered as `emerging`.

The learner UI should use friendly labels such as “Just starting”, “Growing”,
“Getting steady”, and “Strong”. Numerical 0–100 scores are not required for the
initial feature.

## Metrics

### Shared language metrics

| Metric                | Applies to              | What to assess                                                                                       | Do not assess                                           |
| --------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `scene_understanding` | Scene description only  | Supported objects, people, actions, and relationships described accurately.                          | Personal follow-up answers or unverified scene details. |
| `grammar`             | Both turns              | Sentence formation, verbs, articles, plurals, agreement, prepositions, and age-appropriate control.  | Punctuation in a spoken transcript.                     |
| `vocabulary`          | Both turns              | Relevant and precise nouns, verbs, adjectives, adverbs, and variety appropriate to the task.         | Rare words merely for being advanced.                   |
| `expression`          | Both turns              | Complete ideas, connected sentences, clarity, and development with useful detail.                    | Accent, speed, or text formatting.                      |
| `conversation`        | Personal follow-up only | Whether the learner answers the question, adds relevant detail or an example, and sustains the idea. | Scene accuracy.                                         |

### Mode-specific metrics

| Metric                | Mode    | What to assess                                                                        | Required evidence                                  |
| --------------------- | ------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `writing_conventions` | Written | Spelling, capitalisation, and punctuation where enough text exists.                   | Learner-entered text.                              |
| `spoken_fluency`      | Verbal  | Speech duration, pace, pauses, repeated fillers, and ability to complete ideas.       | Audio duration and reliable transcript/timestamps. |
| `pronunciation`       | Verbal  | Coming soon. Do not request, score, recommend, or route lessons from this metric yet. | A future audio-aware pronunciation provider.       |

Do not assess written answers for fluency or pronunciation. Spoken fluency may
use the transcript, recording duration, word rate, visible fillers, and idea
completion. Do not infer pauses without timestamps. Do not assess spoken
transcripts for spelling or punctuation. Do not use transcription confidence as
a pronunciation score. Show pronunciation as **Coming soon**.

## Input model

```ts
type ConversationTurnKind =
  "scene_description" | "picture_follow_up" | "personal_follow_up" | "unknown";

type ConversationTurn = {
  answerMode: "spoken" | "written";
  audioDurationInSeconds?: number;
  isGrounded: boolean;
  isRelevantToFocus: boolean;
  kind: ConversationTurnKind;
  languageWarning: boolean;
  prompt: string;
  responseText: string;
};

type PictureConversationInput = {
  pictureFilename: PictureFilename;
  turns: ConversationTurn[];
};
```

The browser submits only the selected local picture filename. The server loads
the trusted detailed image description before requesting metrics. The
implementation may enrich this input with deterministic counts such as words
and sentences. These are signals for the evaluator, not learner-facing scores.

## Output model

```ts
type LearningSkill =
  // Grammar
  | "articles"
  | "present_continuous"
  | "past_tense"
  | "future_forms"
  | "subject_verb_agreement"
  | "plural_nouns"
  | "prepositions"
  | "pronouns"
  | "question_forms"
  // Vocabulary
  | "precise_nouns"
  | "action_verbs"
  | "descriptive_adjectives"
  | "descriptive_adverbs"
  | "word_variety"
  | "topic_vocabulary"
  // Expression
  | "complete_sentences"
  | "sentence_connectors"
  | "sentence_variety"
  | "narrative_sequence"
  | "detail_expansion"
  // Conversation and scene description
  | "answer_expansion"
  | "turn_taking"
  | "scene_detail_noticing"
  | "spatial_language"
  | "action_relationships"
  // Spoken delivery
  | "read_aloud_pacing"
  | "pause_chunking"
  | "filler_reduction"
  | "sound_articulation"
  | "word_stress"
  | "sentence_stress_and_intonation"
  // Written delivery
  | "spelling"
  | "capitalisation"
  | "punctuation";

type LearningTrack =
  | "grammar"
  | "vocabulary"
  | "expression"
  | "conversation"
  | "scene_description"
  | "spoken_fluency"
  | "pronunciation"
  | "writing_conventions";

type MetricId =
  | "scene_understanding"
  | "grammar"
  | "vocabulary"
  | "expression"
  | "conversation"
  | "writing_conventions"
  | "spoken_fluency"
  | "pronunciation";

type MetricBand = "emerging" | "developing" | "secure" | "strong";

type MetricEvidence = {
  turn: ConversationTurnKind;
  learnerText: string;
  observation: string;
};

type MetricResult = {
  id: MetricId;
  status: "assessed" | "not_assessed";
  band?: MetricBand;
  confidence: "low" | "medium" | "high";
  evidence: MetricEvidence[];
  strength?: string;
  nextSkill?: LearningSkill;
  unavailableReason?: string;
};

type PictureConversationAssessment = {
  metrics: MetricResult[];
  primaryRecommendation: {
    track: LearningTrack;
    skill: LearningSkill;
    reason: string;
  };
  learnerSummary: string;
};
```

All metric IDs applicable to a mode must appear in the output. Inapplicable or
insufficient metrics use `status: "not_assessed"` with `unavailableReason`.

## What happens after feedback

The feedback feature always finishes after it returns a result. It does not
collect another answer or choose the learner’s next activity.

- When feedback is complete or partial, show every assessed area and clearly
  explain any area that needs more evidence. The learner can keep talking about
  the same picture, choose a new picture, or continue to learn.
- When the learner chooses to continue learning, pass the complete assessment
  to the lesson feature. The lesson feature decides what to use and creates the
  activity and its title.
- When the provider is temporarily unavailable, return a kind `retry_later`
  message. The caller can offer a retry without showing an incomplete result.

The prototype stores completed feedback in browser local storage, keyed by the
complete conversation input. An unchanged conversation reuses its validated
feedback instead of regenerating it. It does not store a learner profile.

## Learning skill catalog

`nextSkill` is the per-metric improvement candidate. It must be one of the
`LearningSkill` values above; it is never free-form model text. The assessment
engine selects one of these candidates as `primaryRecommendation.skill` and
sets `primaryRecommendation.track` to its broad learning category.

The lesson feature owns activity selection and all learner-facing lesson content,
including `missionTitle`. It receives `primaryRecommendation.skill` and its
supporting evidence, then produces an age-appropriate mission title, lesson,
exercise, and success criteria.

Pronunciation skills (`sound_articulation`, `word_stress`, and
`sentence_stress_and_intonation`) may only be selected when an audio-aware
provider supplies evidence that supports them.

## Deterministic signals

Collect deterministic signals before model assessment.

| Signal                  | Use                                                             | Limit                                            |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Word and sentence count | Determines whether there is enough evidence to assess a metric. | Does not measure proficiency by itself.          |
| Scene-fact matches      | Helps ground description feedback.                              | Does not punish creative but unverified details. |
| Audio duration          | Supports fluency eligibility.                                   | Does not measure speaking confidence.            |
| Word timestamps         | Supports pace and pause analysis.                               | Does not measure pronunciation.                  |
| ASR quality metadata    | Flags unreliable transcripts.                                   | Does not label a learner unclear or incorrect.   |

## Assessment rules

1. A one- or two-word response may be assessed for scene understanding only if
   it is grounded; grammar, expression, and conversation should usually be
   `not_assessed`.
2. The personal follow-up is assessed for relevance and development, not picture
   accuracy.
3. A learner may describe a supported scene fact in different valid words. The
   evaluator must recognise sensible synonyms.
4. Incorrect scene details should be corrected gently only when the scene
   inventory confirms a conflict.
5. Mark transcript-dependent verbal metrics `not_assessed` when transcription
   quality is uncertain.
6. Select exactly one primary recommendation. Do not present a long list of
   weaknesses.
7. A recommendation must be backed by evidence from an assessed metric and map
   to a concrete next activity.

## Initial learning-track routing

| Evidence                                                | Primary recommendation                  |
| ------------------------------------------------------- | --------------------------------------- |
| Repeated article, verb, agreement, or preposition issue | Grammar mission for that concept.       |
| Vague or repetitive word choice despite enough content  | Descriptive vocabulary mission.         |
| Short, disconnected, or underdeveloped ideas            | Sentence-building/storytelling mission. |
| Follow-up is unanswered or only minimally developed     | Conversation expansion mission.         |
| Reliable audio shows pacing or pause difficulty         | Guided read-aloud fluency mission.      |
| Scene description lacks supported details               | Look-closely-and-describe mission.      |

If multiple rules apply, prioritise the clearest evidence that has a focused,
age-appropriate next activity. If evidence is tied, prefer grammar before
vocabulary before expression.

## Provider contract

Provider adapters must return typed intermediate data, not raw provider payloads.

### Recommended model routing

The initial metric-analysis recommendation is Sarvam `sarvam-30b`. It matches
the existing application integration and is suitable for low-latency, structured
assessment of typed responses and speech transcripts. Use strict JSON Schema
output, a low temperature, and no visible reasoning output.

| Role                                 | Provider and model             | Use when                                                                                      |
| ------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------- |
| Primary metric evaluator             | Sarvam `sarvam-30b`            | Default assessment of picture-conversation turns.                                             |
| Same-provider quality fallback       | Sarvam `sarvam-105b`           | The primary model returns an invalid/insufficient structured assessment after one safe retry. |
| Cross-provider fallback              | OpenAI `gpt-5-mini`            | Sarvam is unavailable, times out, or returns an invalid structured assessment.                |
| Additional cross-provider option     | Groq `openai/gpt-oss-20b`      | Future cost-sensitive option after its provider adapter is added.                             |
| Higher-quality cross-provider option | Groq `llama-3.3-70b-versatile` | Future benchmarking or complex evaluations where latency/cost is acceptable.                  |
| Primary transcription                | Sarvam `saaras:v3`             | Existing English speech-to-text integration. Request timestamps when fluency is in scope.     |
| Transcription quality fallback       | Groq `whisper-large-v3`        | The primary transcript is unavailable or unreliable and a more accurate retry is needed.      |
| Transcription speed fallback         | Groq `whisper-large-v3-turbo`  | Low-latency or lower-cost retry where slightly lower transcription accuracy is acceptable.    |

This routing is a starting configuration, not a claim that one provider is best
for every learner. Retain the same input, rubric, and output schema across all
evaluators, then benchmark them against teacher-labelled attempts before changing
the default.

Only trigger a model fallback for a transport failure, timeout, provider error,
invalid schema, or explicitly unreliable transcription. Do not change models
because an assessment band seems surprising, and never merge scores from two
providers into one attempt.

```ts
type TranscriptionResult = {
  transcript: string;
  quality: "reliable" | "uncertain";
  durationSeconds?: number;
  wordTimestamps?: SpokenResponseSignals["wordTimestamps"];
  provider: string;
  model: string;
};

type AssessmentProvider = {
  assessPictureConversation(
    input: PictureConversationInput,
  ): Promise<PictureConversationAssessment>;
};
```

The provider evaluates one eligible metric per request. Each response is one
small, fixed object with no metric array or optional properties. Run no more than
two metric requests concurrently. Preserve successful partial results when
another metric request fails.

The application determines eligibility before requesting providers:

- shared grammar, vocabulary, and expression use relevant English turns;
- scene understanding uses picture-based turns and the trusted description;
- conversation requires a personal follow-up;
- writing conventions requires a written turn;
- spoken fluency requires a spoken turn with reliable recording duration;
- pronunciation is not requested and is displayed as **Coming soon**.

The provider request must use strict JSON Schema structured output where
available. The application validates every metric response with Zod, combines
the results locally, fills missing metrics as `not_assessed`, and selects one
primary recommendation deterministically before storing or displaying feedback.

Fallback may use another provider only when the learner's consent/privacy policy
allows the response to be sent to that provider. Fallback must preserve the same
schema and record the provider/model used. If all providers fail, return a safe
retry state rather than fabricated metrics.

## Prompt contract

Each metric prompt must include:

- the requested metric and only its allowed next skills;
- only the relevant conversation turns and their prompts;
- the trusted picture description only for scene understanding;
- deterministic spoken signals for spoken fluency;
- the applicable metric definition and four-band rubric;
- `not_assessed` conditions;
- learner-safe feedback requirements.

The prompt must explicitly forbid: scoring punctuation in speech transcripts,
scoring pronunciation without audio-aware evidence, inventing scene facts,
diagnosing personality/confidence, exposing hidden reasoning, and returning
English-language feedback that is age-inappropriate.

## Learner-facing presentation

The default result view shows:

1. One positive title, such as “You are becoming a Story Builder!”
2. Two strengths supported by evidence.
3. One “next superpower” or mission.
4. Optional “Why?” details with short learner quotes and corrections.
5. Skill states rather than a dense list of numeric scores.

Show pronunciation as **Coming soon**, separately from unavailable assessment
results. Do not use error count as the primary learner-facing metric.

## Test matrix

Add fixtures for at least these cases before building the complete UI:

- typed and verbal attempts with the same language content;
- a short but scene-grounded response;
- strong grammar with limited vocabulary;
- rich vocabulary with repeated grammar errors;
- accurate first turn and weak follow-up;
- incorrect scene detail confirmed by the inventory;
- creative but unverified scene detail;
- uncertain/noisy transcript;
- missing timestamps for verbal mode;
- malformed assessment-provider response;
- child, teen, and adult age bands when age-aware behaviour is added.

## Delivery sequence

1. Create Zod schemas for the input, output, and provider intermediate data.
2. Create deterministic signal extraction with unit tests.
3. Create the assessment prompt and provider adapter with strict structured
   output.
4. Add assessment fixtures and schema/provider tests.
5. Add the two-turn conversation API and client state.
6. Build the learner-facing result view with progressive disclosure.
7. Add persistence and multi-attempt progress aggregation later.
