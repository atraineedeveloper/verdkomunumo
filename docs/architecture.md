# Architecture

This document describes the intended architecture of Verdkomunumo as it exists today and the direction new work should follow.

## Stack

- frontend: React 18 + TypeScript + Vite
- routing: React Router v6
- async server state: TanStack React Query v5
- local/global state: Zustand
- backend: Supabase
- validation: Zod
- testing: Vitest + Testing Library + Playwright
- monitoring: Sentry, Vercel Analytics, Vercel Speed Insights
- deployment: Vercel

## High-Level Runtime Model

### Browser App

The client is a single-page application with route-level lazy loading.

The browser is responsible for:

- route transitions
- auth/session-aware rendering
- optimistic UI updates
- PWA behavior and update recovery
- user interaction state

### Supabase

Supabase is the system of record for:

- authentication
- authorization and RLS
- relational application data
- edge functions
- storage-backed media and derived workflows

## Source Layout

Expected responsibilities by directory:

- `src/pages/`
  Route-level composition. Pages should orchestrate feature hooks and render UI, not absorb all business logic.
- `src/components/`
  Reusable presentational and interaction components.
- `src/layouts/`
  Layout and route guards.
- `src/lib/`
  Shared utilities, feature helpers, domain logic, validation, routing helpers, query key factories, monitoring helpers.
- `src/providers/`
  App-level providers and lifecycle integration.
- `src/stores/`
  Zustand stores for client state.
- `src/test/`
  Test helpers and shared setup.
- `supabase/`
  Migrations, templates, config, and edge functions.
- `docs/`
  Durable engineering and product design documentation.

## Preferred Data Flow

The preferred flow for server data is:

1. route or feature component calls a dedicated query or mutation helper
2. helper accesses Supabase
3. response is normalized and typed
4. React Query caches the result with a stable query key
5. UI components render typed data

Do not skip from UI directly into untyped ad hoc data shaping when the same logic will likely be reused.

## React Query Responsibilities

React Query is the primary server-state layer.

It should own:

- fetching
- caching
- invalidation
- optimistic updates
- background refetching

It should not be bypassed casually with direct imperative fetches if the data participates in app state elsewhere.

## Zustand Responsibilities

Zustand is for client state that is not naturally owned by React Query.

Examples:

- auth session mirrors
- theme
- presence indicators
- toasts
- browser/network-specific state

Do not use Zustand as a shadow server cache.
