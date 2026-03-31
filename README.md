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

Use Vite-prefixed variables in [`.env.local.example`](/home/otilio/projects/verdkomunumo/.env.local.example):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5174
VITE_APP_NAME=Verdkomunumo
VITE_DEMO_MODE=false
VITE_GOOGLE_AUTH_ENABLED=true
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is only needed for the local MCP admin tooling.

## Deployment

[`vercel.json`](/home/otilio/projects/verdkomunumo/vercel.json) is configured so Vercel builds the React app directly from the repository root.

Production variables should be:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_APP_NAME`
- `VITE_DEMO_MODE`
- `VITE_GOOGLE_AUTH_ENABLED`

## MCP Admin Server

The local MCP admin server now lives at [`mcp/admin-server.ts`](/home/otilio/projects/verdkomunumo/mcp/admin-server.ts) and can be started with:

```bash
bun run mcp:admin
```

It supports the same moderation and product suggestion workflows as before while reading the current environment format.

## Supabase

Database migrations remain under [`supabase/migrations`](/home/otilio/projects/verdkomunumo/supabase/migrations). The backend is unchanged; the frontend stack is now fully React.

Useful Supabase workflows:

```bash
bun run db:push
```

Pushes pending local migrations to the linked Supabase project.

```bash
bun run db:types
```

Regenerates [`database.types.ts`](/home/otilio/projects/verdkomunumo/src/lib/supabase/database.types.ts) from the linked Supabase schema.

```bash
bun run db:sync
```

Pushes migrations first and then refreshes the local TypeScript schema snapshot.
