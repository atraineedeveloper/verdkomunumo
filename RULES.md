# Verdkomunumo Rules

This file is the short operational rulebook for contributors and AI agents.

Read this before editing code. Use `docs/` for the longer explanation.

## Required Reading Order

1. this file
2. `docs/README.md`
3. the relevant feature spec in `docs/specs/`

## Non-Negotiable Rules

### 1. Keep User-Facing Text Clean

- all product strings should go through i18n unless there is a deliberate exception
- do not introduce mojibake or mixed encodings
- if you see corrupted text, fix it at the source

### 2. Do Not Grow Giant Feature Files Casually

- if a page or component is already large, extract logic before adding major new behavior
- move repeated async logic into hooks or helpers
- do not let route files absorb all business logic

### 3. Avoid Runtime `any`

- do not add new `any` in production paths by default
- use concrete types near Supabase boundaries
- tests can be more flexible, production code cannot

### 4. Respect React Query Contracts

- use `src/lib/query/keys.ts`
- never include `undefined` as an array element in query keys
- optimistic updates must target the exact cache shape used by the active query

### 5. Preserve Auth Continuity

- do not null out stable auth/profile state on refresh-like Supabase auth events when the user identity did not change
- avoid guest/auth flicker during known authenticated transitions

### 6. Keep Error Handling Explicit

- user actions need loading and error states
- failed async actions should surface through explicit UI feedback such as `toast.error()`
- unexpected rendering failures should be capturable centrally

### 7. Do Not Change Architecture Accidentally

- do not introduce new frameworks or patterns casually
- do not invent a second way to solve a problem that already has a project pattern
- if architecture must change, update docs in the same task

### 8. Treat PWA And Lazy Routes As Risky Areas

- route-level lazy loading is allowed
- deployment/caching interactions must be considered
- do not modify chunking strategy casually

## Documentation Rules

- medium and large changes need a spec or a spec update in `docs/specs/`
- update durable docs when behavior, architecture, or standards change
- code is not done if the docs are now misleading

## Validation Rules

For meaningful changes, run the relevant subset of:

- `bun run typecheck`
- `bun run test`
- `bun run build`
- Playwright checks when the flow is user-critical or highly visual

## Decision Default

When in doubt, prefer the option that is:

- easier to reason about
- easier to test
- more consistent with existing patterns
- less likely to create hidden debt
