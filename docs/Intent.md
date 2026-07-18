# Project: Grammar Police

## Goal

Build an end-to-end MVP that demonstrates an AI tutor capable of listening to a user speak, identifying their English learning gaps, generating a personalized learning roadmap, creating a custom lesson, and tracking progress.

The demo should feel magical within the first minute. Prioritize AI interactions over CRUD functionality.

---

# Product Vision

Children in government schools and NGOs often have very different English proficiency levels despite being in the same classroom. Corporate employees need practice in communication.

Our product acts like a personal English tutor.

Instead of following a fixed curriculum, the AI:

* listens to the user speak
* diagnoses strengths and weaknesses
* explains its reasoning
* generates an individualized learning roadmap
* creates personalized speaking exercises
* updates the user's learning graph after every exercise

---

# Primary Demo Flow

## 1. Landing Page

Simple onboarding.

Button:

> Start English Assessment

---

## 2. Speaking Assessment

Display a large image.

Example:

* classroom
* playground
* market
* family

Prompt:

> "Describe everything you see in this picture."

user speaks for approximately 30 seconds.

---

## 3. Speech Processing

Convert speech to text using OpenAI speech models.

Show an animated "AI is listening..." state.

---

## 4. AI Diagnosis (First Wow Moment)

Analyze the transcript using an LLM.

Return structured JSON containing:

* CEFR level (A1–C2)
* vocabulary richness
* grammar mistakes
* sentence complexity
* fluency score
* confidence score
* pronunciation confidence (if available)
* strengths
* weaknesses
* recommended next concepts

Display an animated analysis screen while this happens.

---

## 5. Explainable AI (Second Wow Moment)

Instead of simply displaying scores, explain why the AI reached its conclusions.

Example:

"I noticed you omitted articles several times."

"You mostly used short present-tense sentences."

"You used a good variety of nouns."

"Because of this, today's lesson will focus on Articles and Present Continuous."

This should feel like a teacher giving feedback.

---

## 6. Personalized Learning Roadmap

Generate a learning path dynamically.

Example:

Today

✓ Articles

↓

Present Continuous

↓

Sentence Building

↓

Storytelling

↓

Conversation Practice

This roadmap should be AI-generated, not hardcoded.

---

## 7. AI Lesson Generation (Third Wow Moment)

Generate today's lesson dynamically based on the diagnosis.

Example output:

Mission:
Become an Article Explorer

Exercise:

Display a second picture.

Ask the user to describe it while correctly using:

* a
* an
* the

The lesson should clearly indicate it was generated specifically for this user.

---

## 8. Feedback

After the user responds:

Provide:

* encouragement
* corrections
* one improved example sentence
* one thing they did well
* one thing to improve next

Keep the tone positive and suitable for children.

---

## 9. Progress Screen

Display:

English Level

Grammar

Vocabulary

Speaking Confidence

Today's Achievement

Next Lesson

Use attractive cards and simple visualizations.

---

# Technical Architecture

Use a clean monorepo structure.

apps/

* user

packages/

* ui
* prompts
* shared-types
* shared-components

services/

* speech
* assessment
* lesson-generator
* analytics

Prompts should live in their own module.

Business logic should not be embedded inside UI components.

Use TypeScript throughout.

---

# Engineering Principles

* Modular architecture
* Strong typing
* Reusable components
* Clean folder structure
* Small composable functions
* Separate AI prompt logic from application logic
* Prepare the project for future expansion

Avoid hackathon spaghetti code.

---

# UI Principles

The application should feel like a polished startup product.

Prioritize:

* smooth animations
* loading states
* clean typography
* colorful but accessible design
* responsive layout
* delightful micro-interactions

Every AI step should feel intentional and intelligent.

---

# Success Criteria

The demo should communicate this story:

"A child/user speaks for 30 seconds."

↓

"The AI understands their current English ability."

↓

"The AI explains exactly what the child/user needs to learn."

↓

"The AI generates a personalized lesson."

↓

"The AI tracks progress and recommends what to learn next."

The judges should leave with the impression that this is not just another AI chatbot, but an adaptive AI tutor capable of personalizing education at scale.
