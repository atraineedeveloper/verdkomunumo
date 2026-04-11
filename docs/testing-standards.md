# Testing Standards

Testing in Verdkomunumo is risk-based. The objective is not maximum test count. The objective is stable behavior in production.

## Quality Gates

Before merging meaningful feature work, the expected checks are:

- `bun run typecheck`
- `bun run test`
- `bun run build`

When relevant to the change, also run:

- `bun run test:smoke`
- `bun run test:visual`
- `bun run test:a11y`

## Test Layers

### Unit Tests

Use for:

- pure helpers
- normalization
- validation
- route helper functions
- optimistic update helpers
- domain logic

### Integration Tests

Use for:

- components with form behavior
- auth-provider interactions
- stateful feature logic
- rendering branches that depend on asynchronous state

### E2E Tests

Use for:

- auth flows
- critical navigation
- feed, detail, and messaging flows
- regressions involving route transitions
- browser behavior that cannot be trusted from unit tests alone

### Visual Tests

Use for:

- stable public pages
- auth screens
- high-traffic shared surfaces
- regressions caused by layout drift

### Accessibility Checks

Use for:

- forms
- dialogs
- navigation
- pages with dynamic content

## What To Prioritize

When time is limited, prioritize tests for:

1. auth/session continuity
2. optimistic updates
3. route transitions
4. moderation-sensitive actions
5. encoding and translation-sensitive UI
6. data normalization

## Manual Verification

Some changes still require manual confirmation:

- mobile layout
- multi-route navigation after deploy
- service worker or lazy chunk recovery behavior
- browser permission flows
- image upload ergonomics
