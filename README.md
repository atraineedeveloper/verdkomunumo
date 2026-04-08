# Verdkomunumo

Verdkomunumo is a social network for the Esperanto community, now built as a React + Vite application backed by Supabase.

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

- public landing page
- email and Google authentication
- password recovery flow
- feed, profiles, categories, search, post detail
- messages and notifications
- settings
- floating suggestion flow
- admin dashboard, category management, moderation reports

## Local Development

Install dependencies and start the app from the repository root:

```bash
bun install
bun run dev
```

Useful commands:

```bash
bun run dev
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
bun run email:serve
bun run email:deploy
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
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=Verdkomunumo <noreply@example.com>
EMAIL_WEBHOOK_SECRET=choose-a-long-random-secret
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

`SUPABASE_SERVICE_ROLE_KEY` is only needed for the local MCP admin tooling.

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

## Deployment

[`vercel.json`](./vercel.json) is configured so Vercel builds the React app directly from the repository root.

Production variables should be:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_APP_NAME`
- `VITE_DEMO_MODE`
- `VITE_GOOGLE_AUTH_ENABLED`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_WEBHOOK_SECRET`

## Email Setup

Verdkomunumo now supports:

- Supabase Auth emails for signup confirmation and password reset
- product emails for new comments and new messages via a Supabase Edge Function

### 1. Auth email

Supabase Auth is configured in [`supabase/config.toml`](./supabase/config.toml) with confirmations enabled and reset redirect URLs for the React app.

For production you still need to configure SMTP in the Supabase dashboard using Resend:

- SMTP host: `smtp.resend.com`
- SMTP port: `465` or `587`
- SMTP username: `resend`
- SMTP password: your Resend API key

The HTML templates to paste into Supabase Auth are included at:

- `supabase/templates/auth-confirm-signup.html`
- `supabase/templates/auth-reset-password.html`

### 2. Product emails

The Edge Function lives at:

- `supabase/functions/send-notification-email/index.ts`

Serve locally:

```bash
bun run email:serve
```

Deploy:

```bash
bun run email:deploy
```

The database now queues email deliveries in `notification_email_deliveries`. To make delivery automatic in production, create a database webhook in Supabase for `INSERT` on `public.notification_email_deliveries` and point it to:

```text
https://<project-ref>.supabase.co/functions/v1/send-notification-email
```

Add the header:

```text
x-email-webhook-secret: <EMAIL_WEBHOOK_SECRET>
```

The function accepts either a direct payload like `{"delivery_id":"..."}` or the normal database webhook payload.

## MCP Admin Server

The local MCP admin server now lives at [`mcp/admin-server.ts`](./mcp/admin-server.ts) and can be started with:

```bash
bun run mcp:admin
```

It supports the same moderation and product suggestion workflows as before while reading the current environment format.

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
