# Grammar Police product context

Grammar Police is an English-only, adaptive speaking and reading tutor. It is
designed for children and adult learners who need practice that responds to
their own language rather than a fixed curriculum.

Authentication and learner age capture are later features. Until then, the
prototype must avoid implying that it knows a learner's age or retains an
account-level profile.

## Product loop

1. The learner completes a short activity.
2. The AI gathers evidence about English skills from the response.
3. It explains the most useful next skill in clear, encouraging language.
4. It generates an appropriate next lesson and records progress over time.

The first minute of the demo should make this personalisation visible.

## Activity modes

### Scene conversation

The learner describes a rich picture with several possible subjects, such as a
park containing football players, ducks, a kite, a picnic, and people in a
pavilion. The system must ground feedback in the actual image or in a curated
scene inventory; a short generic picture description is not enough.

After the learner mentions a subject, the AI asks one relevant, open-ended
follow-up question. For example:

- Kite: “Have you ever flown a kite? Tell me about it.”
- Football: “Do you play football or another sport? What are your hobbies?”
- Picnic: “What food would you bring to a picnic?”

This turns object naming into natural English conversation.

### DM with Pari

Learners who cannot or prefer not to use an image can start an equivalent
personal conversation with Pari. They choose a familiar topic such as movies,
stories and poems, hobbies, or daily life, then answer connected questions by
speaking or writing.

This is an equal activity route rather than a recovery screen. It must not ask
the learner to inspect, imagine, or describe an image. Scene-understanding
evidence is unavailable in this mode, while grammar, vocabulary, expression,
conversation, writing, and eligible speech signals can still inform the next
lesson.

### Read aloud

The learner reads a displayed English prompt, such as a favourite-movie
question or an original comic-book line. Since the expected text is known, the
system can assess word accuracy, omissions, pacing, fluency, and pronunciation
signals more reliably than it can for free speech.

### Idiom practice

The learner identifies an idiom from an illustration, explains its meaning, or
uses it in an original sentence. The lesson should test context and expression,
not just memorisation.

### Reading comprehension

The learner reads a short English poem or passage and explains it in their own
words. Use free-to-use, public-domain, openly licensed, or original generated
practice passages. Shakespeare is suitable public-domain material. The product
does not need paid content sources in its initial scope.

Learners may paste material they are authorised to access, including content
available to them through a restricted licence. Treat this as private
user-supplied input: do not publish, redistribute, or use it as shared library
content.

## Learning tracks

The AI may recommend one or more tracks based on evidence gathered across
activities:

- Pronunciation and read-aloud fluency
- Grammar
- Adjectives and adverbs
- Vocabulary and descriptive language
- Idioms and figurative language
- Conversation confidence
- Reading comprehension

Tracks are recommendations, not fixed levels. Every recommendation should say
what evidence led to it and what the learner will practise next.

## Age-appropriate learning

When authentication and age capture are available, every activity must use the
learner's age or age band to choose its reading level, vocabulary, themes,
examples, feedback tone, and safety constraints. Activity research and
implementation must explicitly define the supported age range and how its
content changes by age.

Do not treat age as a cosmetic profile field: it is an input to content
selection and activity design.

## Assessment principles

- All learner-facing content and evaluation are English-only for now.
- Keep feedback supportive, age-appropriate, concrete, and brief.
- Separate measured facts from estimates. A transcript alone cannot reliably
  measure pronunciation; pronunciation scoring needs audio-aware signals or a
  speech provider that exposes them.
- Validate every transcription and AI response against a runtime schema.
- Do not expose provider errors, secret keys, or model reasoning to learners.
- Preserve enough structured evidence to explain scores and track improvement.

## Experience principles

The interface should make learners want to continue. Use a lively but focused
theme, friendly illustrations, and purposeful motion to make recording,
analysis, feedback, and progress feel rewarding. Small interactions should
respond immediately and clearly, while the learning task remains the visual
priority.

Use licensed/open image libraries such as Unsplash where appropriate, or create
original illustrations. Keep source and rights information with curated learning
content. Support reduced motion, readable typography, accessible contrast, and
comfortable touch targets; fun must never reduce clarity or accessibility.

## Target learner record

A future persistent learner profile should include activity attempts,
conversation turns, skill evidence, metric history, recommended tracks,
generated lessons, and progress snapshots. Browser-only session storage is
appropriate only for the current prototype.
