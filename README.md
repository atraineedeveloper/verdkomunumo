# Verdkomunumo

Verdkomunumo is a social network for the Esperanto community. The active frontend is now the React app under [`react-app/`](/home/otilio/projects/verdkomunumo/react-app), backed by Supabase and intended for Vercel deployment.

The legacy SvelteKit app is still present in the repository during migration cleanup, but it should now be treated as reference code, not the primary frontend.

## Active Frontend

- Framework: React 18 + Vite
- Routing: React Router
- Data layer: TanStack Query + Supabase
- Styling: Tailwind CSS 4 + app theme variables
- Deployment target: Vercel static build from `react-app/dist`

## Current Product Surface

The React app includes:

- public landing page
- email and Google auth
- feed, categories, search, post detail, profiles
- messages and notifications
- settings
- floating suggestion flow
- admin dashboard, moderation reports, category management

## Local Development

Run the React app:

```bash
cd react-app
bun install
bun run dev
```

Useful commands:

```bash
cd react-app
bun run dev
bun run test
bun run typecheck
bun run build
```

The dev server runs on:

```text
http://localhost:5174
```

## Environment Variables

For the React app, use variables with the `VITE_` prefix.

Example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5174
VITE_APP_NAME=Verdkomunumo
VITE_DEMO_MODE=false
VITE_GOOGLE_AUTH_ENABLED=true
```

If you also use the local MCP admin server, add:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The root [`.env.local.example`](/home/otilio/projects/verdkomunumo/.env.local.example) now includes both the React variables and optional legacy Svelte variables for migration overlap.

## Deployment

This repository now includes [`vercel.json`](/home/otilio/projects/verdkomunumo/vercel.json) so Vercel builds the React app from the repo root using:

- install: `cd react-app && bun install`
- build: `cd react-app && bun run build`
- output: `react-app/dist`

Production environment variables should be the React ones:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_APP_NAME`
- `VITE_DEMO_MODE`
- `VITE_GOOGLE_AUTH_ENABLED`

Only add `SUPABASE_SERVICE_ROLE_KEY` if you need the local/admin MCP tooling.

## Legacy Svelte Code

The old SvelteKit frontend remains in [`src/`](/home/otilio/projects/verdkomunumo/src) with its own `package.json`, `vite.config.ts`, and `svelte.config.js`. It is useful as migration reference, but it should not be considered the canonical app anymore.

Before deleting it entirely, do a final production smoke test of:

- login and Google OAuth callback
- feed and post interactions
- messaging and notifications
- admin access by role
- Vercel deployment with React env vars only

## Supabase

SQL migrations still live under [`supabase/migrations`](/home/otilio/projects/verdkomunumo/supabase/migrations). The backend remains shared; only the frontend stack is changing.
