# AGENTS.md

## Project purpose

This repository contains an AI-powered English-learning application for users.

The core product flow is:

1. A student describes an image by speaking.
2. The AI asks a relevant personal follow-up based on the image detail the
   student chose to discuss.
3. Speech is converted into a transcript.
4. AI evaluates the student's English abilities.
5. AI identifies strengths and learning gaps.
6. AI generates a personalised learning roadmap and an appropriate exercise.
7. The student's progress is updated.

The application is English-only for now. It supports scene conversation,
read-aloud, idiom, and reading-comprehension activities. Read
`docs/PRODUCT_CONTEXT.md` before changing product behaviour and keep
`docs/ROADMAP.md` accurate when completing planned work.

Authentication and age capture are later features. When an activity is
researched or implemented, define its supported age range and adapt its content,
reading level, vocabulary, examples, feedback tone, and safety constraints to
that age range. Age must drive activity selection once it is available.

## Visual design and interaction

The application should feel inviting, playful, and credible for children and
adult learners. Build a fun learning experience, not a dull form and not a
superficial game.

- Prefer expressive, contextually relevant images and illustrations for scenes,
  idioms, lessons, and progress moments.
- Use reputable image sources such as Unsplash, or create original illustrations
  when they better serve the lesson. Product content must be free-to-use,
  public-domain, openly licensed, or original; do not require paid sources for
  the initial product.
- Learners may paste material they are authorised to access. Treat it as private
  input and do not republish it or add it to a shared content library.
- Use animation deliberately to communicate state and reward progress: listening,
  recording, thinking, success, level transition, and gentle celebration are
  good candidates.
- Add small, responsive micro-interactions to buttons, cards, recording controls,
  and progress indicators. Respect `prefers-reduced-motion` and never make an
  animation block reading, recording, or task completion.
- Keep the visual system cohesive: clear typography, accessible contrast,
  generous touch targets, concise copy, and a limited set of meaningful colours.
- Do not add visual flair that obscures instructions, distracts from speech, or
  makes assessment feedback difficult to understand.

The application must remain easy to understand, demonstrate, test, and extend during the hackathon.

---

## Engineering priorities

When making implementation decisions, prioritise in this order:

1. Correctness
2. Readability
3. Simplicity
4. Testability
5. Reusability
6. Performance

Do not introduce abstractions purely to make the architecture appear sophisticated.

Prefer straightforward code that another developer can understand quickly.

---

## General coding rules

* Use TypeScript throughout.
* Enable strict TypeScript settings.
* Avoid `any`. Use `unknown` and validate it when necessary.
* Use descriptive names rather than abbreviations.
* Keep functions focused on one responsibility.
* Prefer early returns over deeply nested conditionals.
* Avoid files that contain unrelated responsibilities.
* Avoid hidden side effects.
* Do not leave dead code, commented-out code, or unused imports.
* Do not duplicate business rules.
* Add comments only when they explain why something is done.
* Do not write comments that simply repeat the code.
* Prefer readable code over clever code.
* Do not prematurely optimise.

---

## Function guidelines

A function should:

* perform one identifiable task
* have a descriptive verb-based name
* accept explicit dependencies and inputs
* return a predictable result
* avoid modifying unrelated state
* remain small enough to understand without extensive scrolling

Split a function when it performs multiple independent operations.

Do not split functions merely to satisfy an arbitrary line count.

Example preferred names:

* `transcribeStudentRecording`
* `assessStudentEnglish`
* `generateLearningRoadmap`
* `createPersonalisedExercise`
* `recordExerciseAttempt`

Avoid vague names such as:

* `handleData`
* `process`
* `execute`
* `helper`
* `utils`
* `doAssessment`

---

## Component guidelines

React components should primarily handle presentation and user interaction.

Do not place the following directly inside large UI components:

* API integration logic
* AI prompt construction
* transcript analysis
* assessment mapping
* scoring rules
* database transformations

Move these concerns into appropriate services, hooks, or domain modules.

Use composition instead of creating extremely configurable components.

A component should have a clear purpose and a small, understandable interface.

---

## Architecture boundaries

Organise code by domain or feature, not only by technical file type.

Preferred structure:

```text
apps/
  student-web/

packages/
  ui/
  shared-types/
  validation/

services/
  speech/
  assessment/
  roadmap/
  exercises/
  progress/

docs/
  architecture/
```

Within a feature:

```text
assessment/
  assessment.types.ts
  assessment.schema.ts
  assessment.service.ts
  assessment.prompt.ts
  assessment.mapper.ts
  assessment.test.ts
```

Keep AI prompts separate from UI components and request handlers.

Keep provider-specific OpenAI code behind interfaces so that domain logic does not depend directly on an SDK.

---

## Domain modelling

Use explicit domain types for important concepts.

Examples:

* `StudentProfile`
* `SpeakingAssessment`
* `LearningGap`
* `LearningRoadmap`
* `Exercise`
* `ExerciseAttempt`
* `ProgressSnapshot`

Do not pass unstructured objects between application layers.

Validate all AI responses and external API responses at runtime before using them.

Prefer schemas as the source of truth and infer TypeScript types from them where practical.

---

## AI integration rules

AI output is untrusted external input.

For every AI request:

1. Define a structured response schema.
2. Request structured output.
3. Validate the response.
4. Handle malformed or incomplete output.
5. Provide a safe fallback state.
6. Log enough information for debugging without exposing student-sensitive data.

Prompts must live in dedicated prompt modules.

Prompt modules should clearly specify:

* role
* task
* student age or expected reading level
* allowed output
* required schema
* safety constraints
* positive and age-appropriate tone

Do not rely on parsing free-form AI prose when a structured response can be used.

Do not display private chain-of-thought or hidden model reasoning.

The UI may display concise evidence-based explanations such as:

* the sentence the learner used
* the corrected sentence
* the detected language concept
* why that concept was selected for practice

Do not claim that a transcript alone measures pronunciation accurately. A
pronunciation score must be based on audio-aware evidence or be clearly labelled
as an estimate.

When using images, ground feedback in the actual image through a vision-capable
provider or a curated scene inventory. Do not infer every scene detail from a
generic text description.

---

## Error handling

Do not silently swallow errors.

At service boundaries, convert low-level errors into understandable application errors.

The UI should distinguish between:

* microphone permission denied
* recording failed
* transcription failed
* assessment failed
* invalid AI response
* network unavailable

Every user-facing failure should provide a useful recovery action.

Avoid displaying raw stack traces or provider errors to users.

---

## Testing expectations

Add tests for domain and transformation logic.

Prioritise tests for:

* assessment response validation
* learning-gap prioritisation
* roadmap generation rules
* transcript edge cases
* malformed AI responses
* empty transcripts
* exercise evaluation
* progress updates

Do not over-test basic visual markup during the hackathon.

Every bug fix should include a regression test when practical.

---

## Accessibility and usability

This product is intended for children and teachers.

* Use simple language.
* Use readable font sizes.
* Do not rely only on colour to convey meaning.
* Ensure controls have accessible labels.
* Make microphone status obvious.
* Provide clear recording, processing, success, and failure states.
* Avoid cluttered screens.
* Prefer one primary action per screen.
* Ensure keyboard navigation works for essential actions.

---

## Security and privacy

* Never commit API keys.
* Keep secrets in environment variables.
* Do not expose server-side OpenAI credentials to the browser.
* Avoid storing audio unless required for the demo.
* Do not log complete student recordings or sensitive personal information.
* Validate uploaded files and request payloads.
* Treat all external input as untrusted.

---

## Change process

Before implementing a task:

1. Read the relevant existing files.
2. Summarise the current architecture.
3. Propose the smallest coherent implementation.
4. Identify files that will be added or changed.
5. Mention important assumptions.
6. Then implement.

While implementing:

* make focused changes
* preserve established patterns
* avoid unrelated refactors
* add or update tests
* update documentation when architecture changes

After implementing:

1. Run formatting.
2. Run linting.
3. Run the TypeScript type-checker.
4. Run relevant tests.
5. Report any command that could not run.
6. Summarise the implementation.
7. Explain important design choices.
8. List known limitations or follow-up work.

Do not claim a check passed unless it was actually run successfully.

---

## Scope discipline

Hackathon time is limited.

When asked to implement a feature:

* build the smallest complete vertical slice
* do not add unrelated capabilities
* avoid speculative infrastructure
* use interfaces at important external boundaries
* prefer one clean implementation over multiple incomplete options

Before adding a library, explain why the existing stack is insufficient.

Do not introduce a state-management library, design system, database abstraction, queue, event system, or microservice without a concrete need.

---

## Definition of done

A feature is complete when:

* the primary flow works
* types are explicit
* external responses are validated
* loading, empty, and error states exist
* important logic has tests
* linting and type-checking pass
* relevant tests pass
* the code follows repository conventions
* the change is documented where necessary
