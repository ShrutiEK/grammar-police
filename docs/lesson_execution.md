## Recommended architecture

Keep three responsibilities separate:

```text
Assessment metrics
      ↓
Deterministic lesson selector
      ↓
AI question generator
      ↓
Validated exercise
      ↓
Learner response
      ↓
Deterministic difficulty update
```

The AI should generate question content. It should not decide the learner’s weakness, score correctness, or control difficulty progression.

## 1. Convert metrics into one learning target

Use the assessment’s `primaryRecommendation` when it is supported by an assessed metric and evidence.

The lesson request should contain:

- `track`: grammar, vocabulary, expression, etc.
- `skill`: articles, descriptive adjectives, sentence connectors, etc.
- `band`: emerging, developing, secure, or strong.
- Learner’s original sentence.
- A safe explanation of the problem.
- Previous exercise attempts.
- Current difficulty.
- Previously generated questions to avoid repetition.

Example:

```json
{
  "track": "vocabulary",
  "skill": "descriptive_adjectives",
  "band": "emerging",
  "learnerEvidence": "There is a kite.",
  "observation": "The learner used relevant nouns but few descriptive details.",
  "difficulty": 1,
  "recentAttempts": [],
  "previousPrompts": []
}
```

Do not send every metric to the generator. Give it one tightly scoped target.

## 2. Create a curated exercise blueprint

Before asking the AI to write questions, define what good practice looks like for each skill family.

| Skill family | Useful exercise types                                 |
| ------------ | ----------------------------------------------------- |
| Articles     | Fill the blank, choose `a/an/the`, correct a sentence |
| Adjectives   | Select a precise adjective, improve a plain sentence  |
| Verb forms   | Complete a sentence, choose the correct verb form     |
| Prepositions | Fill the blank using explicit textual positions       |
| Vocabulary   | Replace vague words, select precise nouns or verbs    |
| Expression   | Join ideas, expand an answer, order sentences         |
| Conversation | Choose or produce a relevant expanded response        |
| Fluency      | Read-aloud or spoken exercise using audio evidence    |

Each blueprint should define:

- Allowed question formats
- Difficulty progression
- Expected answer structure
- Common misconceptions
- Good distractor rules
- Content and safety constraints
- Examples of acceptable questions

This produces more reliable content than one universal prompt.

## 3. Use clear difficulty definitions

Difficulty should change the language operation—not merely sentence length.

For example, adjectives:

- Level 1: Recognize an adjective.
- Level 2: Choose an adjective that fits a noun.
- Level 3: Select the most precise adjective for a sentence.
- Level 4: Improve a weak or repetitive description.
- Level 5: Choose between subtle adjective meanings in context.

Articles:

- Level 1: Basic `a` versus `an`.
- Level 2: First mention using `a/an`.
- Level 3: First mention versus known item using `the`.
- Level 4: Mixed article choices in natural sentences.
- Level 5: More subtle zero-article and contextual usage.

Store these definitions in code or curated configuration. The model receives the exact definition for the requested skill and level.

## 4. Use few-shot examples

Yes—few-shot examples will materially improve consistency.

Use two or three examples for the requested skill family and difficulty:

- One strong example.
- One example showing good distractors.
- One negative example with an explanation of why it must not be generated.

Example:

```text
Good:
Prompt: Maya carried a ___ umbrella.
Choices: striped, softly, carried
Correct choice: striped

Bad:
Prompt: Look at this picture. What colour is the umbrella?
Reason: No picture is provided.

Bad:
Prompt: The umbrella was striped. Which adjective describes it?
Reason: The prompt unnecessarily reveals the answer.
```

Do not place examples for all skills in every request. Select only the examples relevant to the current skill and level to reduce cost and confusion.

## 5. Structure the generation prompt

The prompt should include:

1. Role: supportive English exercise writer.
2. Exact target skill.
3. Current difficulty and its definition.
4. Learner evidence and misconception.
5. Allowed exercise format.
6. Recent mistakes and successful attempts.
7. Previous prompts to avoid.
8. Rules for concise, independent questions.
9. Required structured JSON schema.
10. Two or three relevant examples.

The prompt should explicitly require:

- One language concept per question.
- Exactly one defensibly correct answer.
- Plausible but clearly incorrect distractors.
- No missing pictures, passages, or external context.
- No answer revealed in the prompt.
- Plain choices without `A/B/C` prefixes.
- Brief educational hints and explanations.
- English-only, age-neutral content until age is available.

## 6. Validate generated questions

Schema validation alone is insufficient. Add deterministic quality checks:

- Three unique choices.
- Correct-choice index exists.
- Choices do not contain option prefixes.
- Prompt is reasonably concise.
- No references to unavailable material.
- Correct answer is not accidentally revealed.
- Prompt is different from recent questions.
- No identical or nearly identical choices.

Then add skill-specific checks where practical:

- An articles question must contain an article decision.
- A fill-in-the-blank question must contain one blank.
- A connector question must express a relationship between ideas.
- Pronunciation exercises require audio-aware evidence.

Invalid generation should retry once or twice with the validation errors included in the retry prompt.

## 7. Control adaptation deterministically

Start with the requested simple rule:

```text
Correct answer   → difficulty + 1
Incorrect answer → same difficulty
```

Improve it later to avoid lucky guesses:

- First correct answer: increase challenge slightly.
- Two incorrect answers at one level: keep the level and change the explanation or exercise format.
- Repeated incorrect answers: introduce a worked example before another question.
- Two or three consecutive correct answers: mark the level as demonstrated.
- Correct answer after using a hint: treat as supported success, not full mastery.

Track:

```ts
type SkillPracticeState = {
  skill: LearningSkill;
  difficulty: 1 | 2 | 3 | 4 | 5;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  hintsUsed: number;
  recentPrompts: string[];
  recentMisconceptions: string[];
};
```

## 8. Evaluate quality before relying on it

Create a teacher-reviewed test set containing:

- Every supported skill.
- Every difficulty level.
- Common learner mistakes.
- Child-, teen-, and adult-appropriate cases later.
- Malformed and ambiguous model outputs.

Score generated questions for:

- Alignment with the target skill.
- Correctness.
- Exactly one correct answer.
- Appropriate difficulty.
- Clarity.
- Independence from missing context.
- Educational value.
- Distractor quality.
- Repetition.

Generate several hundred offline questions and review them before tuning prompts or changing models.

## Suggested delivery order

1. Define skill-specific difficulty rubrics.
2. Create exercise blueprints for the five most common skills.
3. Add curated positive and negative few-shot examples.
4. Build prompt composition from skill + level + evidence.
5. Add deterministic quality validation.
6. Retry invalid generations with concrete validation feedback.
7. Track attempts and difficulty in a typed practice state.
8. Add worked examples after repeated incorrect answers.
9. Build an offline question-quality evaluation suite.
10. Expand to every `LearningSkill` after the initial families perform reliably.

The strongest approach is therefore hybrid: deterministic diagnosis and adaptation, curated pedagogy and examples, AI-generated variation, and strict validation before anything reaches the learner.

## Implementation status

Implemented in the initial vertical slice:

- [x] Validate and select one evidence-backed `primaryRecommendation`.
- [x] Pass the selected track, skill, metric band, learner evidence, and observation to the lesson generator.
- [x] Define five difficulty stages, exercise formats, misconceptions, distractor rules, and focused few-shot examples for articles, descriptive adjectives, present continuous, and sentence connectors.
- [x] Select only the blueprint and examples relevant to the current skill.
- [x] Track recent attempts, selected incorrect answers, hint use, streaks, and previous prompts in typed session state.
- [x] Start difficulty from the assessment band, increase it after a correct answer, and keep it unchanged after an incorrect answer.
- [x] Add extra scaffolding after two consecutive incorrect attempts.
- [x] Validate exercise structure, allowed format, unique choices, target-skill alignment, unavailable context, answer leakage, length, and repetition.
- [x] Generate adaptive exercises with OpenAI GPT-5.6 Terra using strict structured output and low-variance settings; keep Sarvam for unrelated application flows.
- [x] Require the generator to independently verify the answer, distractors, and explanation before returning an exercise.
- [x] Fall back to Gemini 2.5 Flash after OpenAI exhausts its adaptive-exercise retries, using the same prompt and validation rules.
- [x] Rotate contexts across all supported learning skills and reject repeated lexical targets or recycled scenarios.
- [x] Preserve recent exercise history across “Play again” so a new mission for the same skill receives a fresh question set.
- [x] Use OpenAI’s Responses API with strict structured output as the primary exercise provider; Gemini remains optional fallback only.
- [x] Retry invalid model output twice and include concrete validation feedback in regeneration requests.
- [x] Provide explicit goals, misconceptions, formats, and examples for every text-practicable `LearningSkill`; pronunciation-only skills are blocked until an audio-aware activity exists.
- [x] Require every choice in a multi-blank question to contain the same number of ordered, comma-separated answers as the prompt has blanks.

Still requires product or teacher input:

- [ ] Review and approve the initial few-shot examples, difficulty rubrics, and misconception lists for the four focused skills.
- [ ] Review and refine the compact first-pass rules for skills outside the four deeply curated blueprints before treating them as production-quality.
- [ ] Create a teacher-labelled offline evaluation set and acceptance threshold for alignment, correctness, clarity, difficulty, and distractor quality.
- [ ] Define age-band content rules when learner age capture is implemented.
