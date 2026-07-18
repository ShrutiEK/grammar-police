# Grammar Police

Grammar Police is a personalised English speaking tutor. The Phase 1 MVP will
let a learner describe a picture, transcribe their response, assess their English,
and recommend the next lesson.

Version 1 treats every assessment as an independent session. It does not persist
learner performance, recordings, or lessons.

## Prerequisites

- Node.js 22 or newer
- pnpm 10

## Setup

Install dependencies:

```bash
pnpm install
```

Copy the environment template when OpenAI integration is added:

```bash
cp .env.example .env.local
```

Keep `OPENAI_API_KEY` server-side. The initial application shell does not require
the key to run.

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
