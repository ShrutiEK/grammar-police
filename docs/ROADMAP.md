# Grammar Police delivery roadmap

This is the team's issue-tracking roadmap. Check off an item only when its
acceptance criteria are met. Keep implementation-specific detail in linked
issues or pull requests.

## Milestone 0 — Align the prototype

- [x] Open the picture conversation directly from the home route; keep the old
      `/assessment` URL as a compatibility redirect.
- [x] Replace test-like learner-facing terminology using the staged
      [learner copy refresh plan](LEARNER_COPY_REFRESH_PLAN.md).
- [x] Replace the fixed five-picture “roadmap” language with accurate prototype
      language until AI-generated paths exist.
- [x] Fix picture metadata so image, alt text, learner instruction, and scene
      description describe the same scene.
- [x] Update environment documentation to use Sarvam consistently, or complete
      a deliberate provider migration.
- [x] Add a visible English-only note and enforce it in activity prompts and
      assessments.
- [ ] Define the learner age bands each activity supports and the content,
      reading-level, and safety adaptations required for each band.

## Milestone 1 — Grounded scene conversation

- [ ] Define a `Scene` model with image, licensed source, alt text, and a
      curated inventory of visible subjects/actions.
- [ ] Send the actual image to a vision-capable model, or use the curated scene
      inventory as the source of truth for feedback.
- [x] Store a multi-turn conversation session: learner utterance, detected
      subject, AI follow-up, and learner reply.
- [x] Generate one relevant follow-up question from the subject the learner
      chose, rather than hard-coding the conversation path.
- [ ] Add schemas and tests for scene understanding, follow-up generation, and
      malformed provider responses.

**Done when:** a learner can describe any supported detail in a picture, receive
a relevant personal question, and see feedback tied to both turns.

## Milestone 2 — Trustworthy assessment and explanations

The detailed contract for picture-conversation metrics lives in
[`METRICS_SPEC.md`](METRICS_SPEC.md).

- [ ] Define evidence-backed metrics for grammar, vocabulary, communication,
      confidence, fluency, and pronunciation.
- [ ] Add CEFR level, strengths, learning gaps, and recommended concepts to the
      assessment schema.
- [ ] Generate concise explanations such as “You used clear nouns, but often
      omitted articles,” with supporting transcript evidence.
- [x] Allow assessed results to report `no_gap` or an `unmapped` concept instead
      of forcing an unrelated supported learning skill.
- [ ] Distinguish transcription failures, invalid model output, network errors,
      and unavailable assessment services in the UI.
- [ ] Do not label transcript-only inference as a precise pronunciation score.

**Done when:** every displayed score has structured evidence and an understandable
next-step explanation.

## Milestone 3 — Activity library

- [ ] Build a read-aloud activity with a reference text and word-level
      comparison of expected versus spoken text.
- [ ] Add audio-aware pronunciation/fluency analysis through a suitable speech
      provider.
- [ ] Build idiom activities: illustrated meaning, learner explanation, and
      original-sentence practice.
- [ ] Build reading-comprehension activities for free-to-use, public-domain,
      openly licensed, or original English passages.
- [ ] Keep source and rights information for product-supplied images, poems,
      and comic excerpts; do not require paid sources for the initial product.
- [ ] Treat learner-pasted material as private user input. Do not redistribute
      it or add it to the shared activity library.

**Done when:** each activity produces a typed attempt and skill evidence that
the learning engine can consume.

## Milestone 4 — Personalised learning engine

- [ ] Define domain models for `LearnerProfile`, `SkillEvidence`,
      `LearningTrack`, `LessonPlan`, `Exercise`, and `ProgressSnapshot`.
- [ ] Select and rank learning tracks from recent and historical evidence.
- [ ] Generate a lesson with a mission, explanation, example, exercise, and
      success criteria tailored to the learner.
- [ ] Let the learner complete the generated exercise and receive a correction,
      an improved example sentence, a strength, and one next improvement.
- [ ] Persist attempts and progress securely beyond browser local storage.
- [ ] Add authentication and age capture as a later feature, with clear consent
      and age-appropriate content selection.

**Done when:** two learners with different evidence receive meaningfully
different lessons and next steps.

## Milestone 5 — Progress and demo polish

- [ ] Add a progress screen for English level, grammar, vocabulary, speaking
      confidence, today's achievement, and next lesson.
- [ ] Visualise improvement over time without overstating confidence or
      precision.
- [ ] Add intentional loading, listening, analysis, and transition states.
- [ ] Test the complete happy path and failure states on mobile and desktop.
- [ ] Add privacy, consent, retention, and deletion decisions before storing
      learner audio or profiles.
- [ ] Define safeguards for user-pasted third-party content and account data.

**Done when:** the demo clearly shows assessment → explanation → personalised
lesson → updated progress in a single session.

## Current known risks

- A transcript cannot directly prove pronunciation quality.
- Generic image descriptions cannot support feedback on all visible scene
  details.
- Prompt-only JSON output can be malformed; schemas and recovery paths are
  required.
- Learner audio and performance data are sensitive and need explicit handling
  decisions before persistence.
