# Verdkomunumo

Verdkomunumo is an authenticated member map for the Esperanto community, built as a React + Vite application backed by Supabase.

## Stack

- React 18
- Vite
- React Router
- TanStack Query
- Supabase
- Tailwind CSS 4
- Zod
- Vercel Analytics

## Product Surface

The app currently includes:

- email and Google authentication, with username-based login
- password recovery flow
- an authenticated member map showing opted-in members by structured location
- profile settings (identity, location, map visibility, appearance)

## Local Development

Install dependencies and start the app from the repository root:

```bash
bun install
bun run dev
```

Useful commands:

```bash
bun run dev
bun run guard:quality
bun run test
bun run test:smoke
bun run test:visual
bun run test:visual:update
bun run test:a11y
bun run test:e2e:install
bun run typecheck
bun run build
bun run db:push
bun run db:types
bun run db:sync
```

The Vite dev server runs on:

```text
http://localhost:5174
```

## Environment Variables

Use Vite-prefixed variables in [`.env.example`](./.env.example):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5174
VITE_APP_NAME=Verdkomunumo
VITE_DEMO_MODE=false
VITE_GOOGLE_AUTH_ENABLED=true
VITE_SENTRY_DSN=
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

`SUPABASE_SERVICE_ROLE_KEY` is only needed for trusted server-side/tooling scripts (e.g. `scripts/backfill-profile-location-to-structured.mjs`), never in client code.

## QA And Monitoring

The repository now supports four complementary quality layers:

- `bun run test` for unit and integration coverage with Vitest
- `bun run test:smoke` for public-route smoke tests with Playwright
- `bun run test:visual` for visual regression checks
- `bun run test:a11y` for accessibility checks with `axe`
- optional Sentry runtime monitoring through `VITE_SENTRY_DSN`

Before running browser tests locally, install the Playwright browser once:

```bash
bun run test:e2e:install
```

Visual snapshots are stored in the repo. When an intentional UI change happens, refresh them with:

```bash
bun run test:visual:update
```

## Documentation

The repository includes a full engineering handbook in [`docs/`](./docs/).

- documentation index: [`docs/README.md`](./docs/README.md)
- engineering principles: [`docs/engineering-principles.md`](./docs/engineering-principles.md)
- architecture guide: [`docs/architecture.md`](./docs/architecture.md)
- coding standards: [`docs/coding-standards.md`](./docs/coding-standards.md)
- testing standards: [`docs/testing-standards.md`](./docs/testing-standards.md)
- i18n standards: [`docs/i18n-standards.md`](./docs/i18n-standards.md)
- performance and reliability guide: [`docs/performance-and-reliability.md`](./docs/performance-and-reliability.md)
- security and privacy guide: [`docs/security-and-privacy.md`](./docs/security-and-privacy.md)
- process guide (OpenSpec workflow): [`docs/spec-driven-development.md`](./docs/spec-driven-development.md)
- feature specs (source of truth): [`openspec/specs/`](./openspec/specs/)
- vibe coding playbook: [`docs/vibe-coding-playbook.md`](./docs/vibe-coding-playbook.md)
- documentation governance: [`docs/documentation-governance.md`](./docs/documentation-governance.md)
- review and release checklist: [`docs/review-and-release-checklist.md`](./docs/review-and-release-checklist.md)
- stabilization program: [`docs/project-stabilization-program.md`](./docs/project-stabilization-program.md)
- QA coverage matrix: [`docs/qa-coverage-matrix.md`](./docs/qa-coverage-matrix.md)

## Deployment

[`vercel.json`](./vercel.json) is configured so Vercel builds the React app directly from the repository root.

Production variables should be:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_APP_NAME`
- `VITE_DEMO_MODE`
- `VITE_GOOGLE_AUTH_ENABLED`

## Auth Email

Supabase Auth is configured in [`supabase/config.toml`](./supabase/config.toml) with confirmations enabled and reset redirect URLs for the React app.

For production you still need to configure SMTP in the Supabase dashboard (e.g. Resend or another provider).

The HTML templates to paste into Supabase Auth are included at:

- `supabase/templates/auth-confirm-signup.html`
- `supabase/templates/auth-reset-password.html`

## Supabase

Database migrations remain under `supabase/migrations`. The backend is unchanged; the frontend stack is now fully React.

Useful Supabase workflows:

```bash
bun run db:push
```

Pushes pending local migrations to the linked Supabase project.

```bash
bun run db:types
```

Regenerates `src/lib/supabase/database.types.ts` from the linked Supabase schema.

```bash
bun run db:sync
```

Pushes migrations first and then refreshes the local TypeScript schema snapshot.

## Open Source

This project is open source under the MIT License.

- License text: [`LICENSE`](./LICENSE)
- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Community standards: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- Vulnerability disclosure: [`SECURITY.md`](./SECURITY.md)

### Dependency license compatibility

When adding or updating dependencies, contributors should verify license compatibility with MIT and document any non-standard licensing in pull requests.
