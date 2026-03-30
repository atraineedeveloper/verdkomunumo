# Verdkomunumo

Verdkomunumo is a social network for the Esperanto community, built with SvelteKit, Supabase, and Vercel.

It includes a real authenticated app, image uploads, private messaging, notifications, admin tools, multilingual UI, and a demo mode for frontend work without a live backend.

## Highlights

- Chronological social feed with categories
- Posts with up to 4 images
- Comments, likes, follows, and user profiles
- Private messaging with unread counts
- Notifications for social activity
- Search for users and posts
- Admin area for moderation and app feedback
- 9 UI languages: `eo`, `es`, `en`, `pt`, `ja`, `fr`, `de`, `ko`, `zh`
- Demo mode for local UI development

## Tech Stack

- Framework: SvelteKit 2 + Svelte 5
- Runtime / package manager: Bun
- Database / auth / storage: Supabase
- Deployment: Vercel
- Styling: CSS variables with multiple themes
- Validation: Zod
- Icons: Lucide Svelte + flag-icons
- Analytics: Vercel Analytics

## Local Development

Install dependencies and start the dev server:

```bash
bun install
bun run dev
```

Useful scripts:

```bash
bun run dev
bun run build
bun run preview
bun run check
```

## Environment Variables

Create `.env.local` from `.env.local.example`.

Required values for a real backend:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_APP_NAME=Verdkomunumo
PUBLIC_DEMO_MODE=false
PUBLIC_GOOGLE_AUTH_ENABLED=true
```

For demo mode:

```env
PUBLIC_DEMO_MODE=true
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

## MCP Admin Server

This repo includes a local MCP server focused on product suggestions and moderation workflows.

Run it with:

```bash
bun run mcp:admin
```

Available tools include:

- `admin_snapshot`
- `list_app_suggestions`
- `update_app_suggestion_status`
- `list_content_reports`
- `update_content_report_status`

The server reads `PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. A starter editor config is included in [`/.vscode/mcp.json`](/home/otilio/projects/verdkomunumo/.vscode/mcp.json).

## Supabase Setup

This repo includes SQL migrations under [`supabase/migrations`](/home/otilio/projects/verdkomunumo/supabase/migrations).

Typical setup flow:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Notes:

- `001_initial_schema.sql` creates the base schema, RLS, triggers, storage buckets, and core policies.
- Later migrations include messaging and notification fixes, plus app feedback tables.
- If you want starter data such as categories, apply the seed flow used in this repo.

## Authentication

Verdkomunumo supports:

- Email/password authentication
- Google OAuth through Supabase Auth

For local development, make sure your Supabase Auth settings allow:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- your production Vercel URL

Google OAuth also requires the Supabase callback URL in Google Cloud:

```text
https://<your-project-ref>.supabase.co/auth/v1/callback
```

## Deployment

The app is designed for Vercel using `@sveltejs/adapter-vercel`.

Production setup usually needs these environment variables in Vercel:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUBLIC_APP_URL`
- `PUBLIC_DEMO_MODE`
- `PUBLIC_GOOGLE_AUTH_ENABLED`

## Project Structure

```text
src/
├── lib/
│   ├── browser/              # Client-side helpers such as image optimization
│   ├── components/           # Reusable UI
│   │   └── layout/           # Navbar, sidebar, mobile nav
│   ├── i18n/                 # Translations and locale helpers
│   ├── server/               # Server-side helpers for social logic and storage
│   ├── stores/               # Client stores
│   ├── mock.ts               # Demo-mode data
│   ├── types.ts              # Shared TypeScript types
│   └── validators.ts         # Zod schemas
├── routes/
│   ├── (auth)/               # Login and register
│   ├── (app)/                # Authenticated app routes
│   │   ├── feed/
│   │   ├── category/[slug]/
│   │   ├── post/[id]/
│   │   ├── profile/[username]/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── search/
│   │   └── settings/
│   ├── admin/                # Staff tools
│   └── api/                  # Internal endpoints
└── app.css                   # Global theme and layout styles
```

## Current State

The project is past the mock-only stage and already uses the real Supabase backend for:

- authentication
- posts, comments, likes, and follows
- messaging and notifications
- profile settings and uploads
- admin workflows
- app feedback suggestions

There is still room to improve realtime behavior, polish, and moderation depth, but the core product flows are already connected to the backend.

## Development Notes

- The app uses Svelte 5 runes.
- Demo mode is useful for visual work when Supabase is not available.
- Chrome may request `/.well-known/appspecific/com.chrome.devtools.json` in development; this repo already includes devtools support for that.
- Messaging and notifications rely on Supabase RLS, so schema drift between local code and remote DB can break features quickly.

## License

No license has been added yet. If this project is meant to be open source, add one before publishing broadly.
