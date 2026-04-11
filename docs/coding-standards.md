# Coding Standards

This document defines how code should be written in Verdkomunumo.

## General Rules

- prefer explicit, readable code over clever abstractions
- preserve existing behavior unless the task explicitly changes it
- avoid hidden side effects
- do not introduce dead code or placeholder code
- every user-visible async action must have explicit loading and error handling

## TypeScript

### Required

- keep `strict` mode compatible
- prefer concrete types over assertions
- use Zod or domain-specific validation for untrusted input
- type Supabase results as close to the boundary as practical

### Disallowed By Default

- `any` in production code
- broad `as unknown as ...` casts unless bridging an unavoidable external typing gap
- `@ts-ignore` without a short justification comment and a documented follow-up

### Acceptable Exceptions

- tests can use small targeted casts to avoid verbose fixtures
- generated files can remain machine-generated
- unavoidable third-party typing gaps can be isolated behind narrow wrappers

## React

### Component Design

- prefer small and medium components with a clear role
- extract complex logic into hooks or helper modules
- keep render paths readable
- make loading, empty, and error states explicit

### State

- use local `useState` for truly local interaction state
- use React Query for server state
- use Zustand for cross-cutting client state
- do not duplicate the same source of truth across local state, Zustand, and query cache unless there is a clear reason

### Effects

- `useEffect` should synchronize with external systems, not replace derived state
- if an effect is hard to explain in one sentence, reconsider the design
- always clean up event listeners, timers, observers, and object URLs

## TanStack React Query

### Query Keys

- use `src/lib/query/keys.ts`
- keep keys stable and composable
- avoid `undefined` array elements in key factories

### Mutations

- use `onMutate` when optimistic behavior materially improves UX
- ensure optimistic updates target the same cache shape used by the corresponding queries
- invalidate only what needs to be refreshed

### Fetchers

- fetchers should return normalized, typed data
- avoid shaping raw Supabase responses directly inside large JSX render branches

## Supabase

### Access Pattern

- keep direct Supabase access close to a well-defined helper or feature boundary
- prefer reusable query/mutation helpers for repeated workflows
- normalize nested relation responses before broad UI usage

### Data Integrity

- rely on database constraints and RLS, but do not assume UI-layer invariants are sufficient
- validate client input before mutation
- handle partial relation data explicitly

## File Size And Complexity

These are review thresholds, not hard compiler errors:

- under 200 lines: healthy by default
- 200-350 lines: acceptable if the role is still coherent
- 350-500 lines: refactor likely needed soon
- over 500 lines: should trigger extraction unless the file is mostly static data or generated content

## Transitional Debt Handling

The repository currently carries some known legacy exceptions.

These are tracked in `quality-baseline.json`.

Rules:

- the baseline is a temporary containment tool, not a justification for new debt
- do not add new entries casually
- when refactoring removes a known violation, remove or tighten the corresponding baseline entry in the same change
- prefer shrinking the baseline over preserving it

## Text And Translation

- do not hardcode user-facing strings in UI unless there is a deliberate exception
- use the translation layer for labels, toasts, buttons, headings, and empty states
- keep source files UTF-8 clean
- if a text string appears corrupted, fix it at the source instead of adding more corrupted variants

## Error Handling

- surface actionable errors where the user can recover
- use `toast.error()` for failed actions that need immediate feedback
- do not swallow errors silently
- log or capture exceptions that indicate broken rendering or unexpected state

## Documentation Requirement

Update or add docs when a change affects:

- architecture
- workflow
- auth behavior
- data ownership
- testing expectations
- product behavior described in specs
