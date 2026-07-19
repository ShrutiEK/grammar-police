# Learner copy refresh plan

## Goal

Make the experience sound like a supportive conversation coach, not a test or
school form. Copy should describe the learner's immediate action or reward in
plain English while keeping technical assessment language inside code, APIs,
logs, schemas, and developer documentation.

## Voice principles

- Lead with the next action: speak, write, keep talking, see feedback, or try a
  challenge.
- Prefer encouraging, concrete language over educational abstractions.
- Do not hide what the product is doing. Feedback must still say what evidence
  was observed and what the learner can improve.
- Use one consistent term for each concept across buttons, status messages,
  headings, errors, and accessibility labels.
- When age capture is added, validate the chosen vocabulary and tone with every
  supported age band rather than making the interface child-only.

## Recommended vocabulary

| Current learner-facing term    | Preferred wording                              | Use in context                                                                            |
| ------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| assessment                     | conversation, check-in, or feedback            | “Start a conversation”; “We couldn't prepare your feedback.”                              |
| learn / learning               | practise, build, explore, or next challenge    | “Try your next challenge”; “Your practice path”                                           |
| submit                         | share                                          | “Share my answer”                                                                         |
| analyze / analyzing            | prepare / putting together                     | “Putting your feedback together…”                                                         |
| transcribing                   | turning your recording into words              | Status text only; keep “transcription” in technical errors where precision helps.         |
| skill / skills                 | strengths, speaking tools, or specific ability | “Your English highlights”; retain concrete labels such as Grammar and Word choice.        |
| measured / assessed / observed | heard, noticed, or enough examples             | “We need another example”; avoid implying audio evidence when only text was checked.      |
| result                         | feedback or highlights                         | “See my feedback”                                                                         |
| score / level                  | progress or current range                      | Use scores only when the metric is evidence-backed and explained.                         |
| exercise                       | challenge or practice                          | “Try a quick word-choice challenge”                                                       |
| roadmap / learning map         | practice path or what to try next              | “Your practice path”                                                                      |
| question                       | prompt                                         | Use “question” when it is genuinely a question; use “prompt” for an activity instruction. |

Do not replace familiar, concrete language merely for novelty. Terms such as
grammar, pronunciation, vocabulary, answer, recording, and feedback are clear
when the surrounding sentence is friendly.

## Copy changes found in the current flow

### First conversation

- “Question 1 of 8” → “First prompt” initially, then “Prompt 2 of 8”.
- “Complete sentences help us understand your communication skills.” →
  “Complete sentences help us understand your ideas.”
- “Submit spoken answer” / “Submit written answer” → “Share my recording” /
  “Share my answer”.
- “Analyzing your English…” → “Putting your feedback together…”.
- “Your answer has been assessed.” → “Your feedback is ready.”
- “Conversation history” → “What we’ve talked about”.

### Feedback and next step

- “Your learning map” → “Your English highlights”.
- “Your skill snapshot” → “What came through”.
- “3 of 7 observed” → “We heard enough examples for 3 of 7 areas”.
- “Not measured yet” → “More examples needed”.
- “Next superpower” → “Try this next”.
- “Continue to learn” → “Try your next challenge”.
- “Your full feedback is ready for the learning activity to use.” →
  “Your next challenge will use what came through in this conversation.”

### Errors and progress states

- Replace generic assessment failures with the failed learner action and a
  recovery step: “We couldn’t check that answer. Try sharing it again.”
- Keep microphone, recording, network, feedback, and invalid-response failures
  distinct as required by the product error model.
- Use aria-live status text that matches visible status text; friendliness must
  not make state changes vague.

## Delivery plan

1. **Create a copy inventory and contract.** Move repeated learner-facing text
   into a small feature-local copy module, grouping recording, conversation,
   feedback, and error states. Keep provider prompts and domain identifiers out
   of this rename.
2. **Refresh the active conversation.** Update the recording panel,
   conversation history, progress buttons, loading states, and recoverable
   errors. Test accessible names and status announcements.
3. **Refresh feedback.** Update headings, evidence-count language, unavailable
   states, recommendation card, and next-action buttons. Map recommendation IDs
   to curated labels instead of displaying underscored provider values.
4. **Validate across states and ages.** Review spoken and written paths, all
   loading/error states, final feedback, mobile layout, keyboard flow, and
   reduced motion. Once age bands exist, review the same copy matrix for each
   supported band.
5. **Measure comprehension.** In demo testing, check whether a new learner can
   identify the primary action and explain what happens next without help.
   Revise ambiguous phrases before adding more playful language.

## Acceptance criteria

- No learner-facing screen uses “assessment,” “submit,” or “analyzing”.
- “Learn” and “learning” appear only where they describe the product category,
  not as vague button or status labels.
- Each button names the immediate action and each loading state names what the
  learner is waiting for.
- Feedback continues to distinguish evidence from estimates, especially for
  pronunciation.
- Essential actions and state changes retain clear accessible names and status
  announcements.
- Copy is reviewed at mobile and desktop sizes and covered by focused component
  tests where behavior depends on exact labels.
