# Engineering Principles

Verdkomunumo is built for a real community, not as a disposable demo. Speed matters, but maintainability matters more than novelty.

## Core Principles

### 1. Stability Over Cleverness

Prefer straightforward code that is easy to debug.

Do not introduce abstractions just because they look advanced. Introduce them only when they reduce repeated complexity or enforce a useful boundary.

### 2. Product Reality Over Local Convenience

Every change should be evaluated against production behavior:

- auth/session continuity
- query cache correctness
- PWA update behavior
- mobile usability
- moderation and abuse cases
- translation consistency

### 3. Fast Iteration Without Silent Damage

The project can move quickly, including AI-assisted development, but must avoid:

- hidden `any` creep
- giant UI files absorbing all logic
- duplicated Supabase query behavior
- text corruption and encoding drift
- speculative refactors without clear benefit

### 4. Spec First For Non-Trivial Changes

For medium and large work, describe behavior first.

The expected order is:

1. define scope
2. document behavior
3. implement
4. validate
5. update durable docs

### 5. Strong Boundaries

Keep distinct responsibilities separate:

- UI rendering
- server state fetching and mutation
- local interaction state
- auth/session orchestration
- normalization and validation
- translation content

### 6. Operational Simplicity

The default answer should not be “add another framework.”

Use the stack already chosen unless the current tools cannot reasonably support the requirement.

## Decision Heuristics

When choosing between alternatives, prefer the option that:

1. is easier to verify with tests and local reasoning
2. creates fewer future migration costs
3. preserves user-visible stability
4. reduces accidental complexity
5. fits existing patterns in the repo

## What Good Looks Like

A high-quality change in this project usually has these properties:

- behavior is defined before coding
- data access is typed and centralized enough to reason about
- UI components stay readable
- optimistic updates are correct
- loading and error states are explicit
- new text goes through i18n
- tests cover the critical path
- docs remain aligned with the implementation

## What We Explicitly Avoid

- feature work landing without any durable design note
- production code relying on `any` when the schema is known
- components that fetch, normalize, mutate, and render everything in one place without a clear reason
- raw hardcoded user-facing strings scattered across the UI
- “temporary” hacks that are not documented and never revisited
- changing architectural direction inside an unrelated feature PR
