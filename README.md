# Grammar Police

Grammar Police is an English-only adaptive speaking and reading tutor. Learners
describe rich scenes, answer relevant follow-up questions, read prompts aloud,
and practise activities such as idioms and reading comprehension. The AI uses
their responses to explain learning gaps, recommend a skill track, generate a
lesson, and show progress over time.

The current prototype implements the first assessment loop: record a response
to a picture, transcribe it, assess it, and display feedback. It stores only
the current browser session in `localStorage`; it does not yet persist a learner
profile, generate adaptive lessons, or maintain a learning graph.

See [product context](docs/PRODUCT_CONTEXT.md) for the agreed product behaviour
and [delivery roadmap](docs/ROADMAP.md) for tracked work.

## Prerequisites

- Node.js 22 or newer
- pnpm 10

## Setup

Install dependencies:

```bash
pnpm install
```

Copy the environment template to enable Sarvam transcription and assessment:

```bash
cp .env.example .env.local
```

Keep `SARVAM_API_KEY` server-side. The application shell can run without it,
but real assessments require the key.

## Development

```bash
pnpm dev
```

Open <http://localhost:3000>.

## Validation

Run every required check:

```bash
pnpm validate
```

The command checks formatting, lint rules, strict TypeScript types, and tests.
Individual commands are also available:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Code boundaries

- `src/app` contains routes and presentation.
- `src/features` contains domain schemas, types, and business rules.
- `src/prompts` contains AI prompt construction.
- `src/integrations` contains provider-specific code.
- `src/config` validates server environment variables.

## Styling

Tailwind CSS theme tokens live in `src/app/globals.css`. Reusable component
classes use `@apply`, while route-specific layout is composed with utilities in
TypeScript components. Add shared styles only when they are used in more than one
place or express a stable product pattern.

AI and external-provider responses are untrusted and must be validated at runtime.
API keys and provider calls must not be exposed to browser code.
