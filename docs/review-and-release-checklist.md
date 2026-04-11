# Review And Release Checklist

Use this checklist before merging meaningful changes or preparing a release.

## Engineering Review

- scope matches the intended feature or fix
- no accidental architectural drift was introduced
- user-facing strings are routed through i18n where expected
- auth, permissions, and query invalidation remain coherent
- no new runtime `any` was introduced without an explicit exception
- file growth remains reasonable or is intentionally documented

## Validation

- `bun run typecheck`
- `bun run test`
- `bun run build`
- run Playwright checks when the flow is user-critical or visual
- confirm any manual verification steps required by the change

## Documentation

- update specs when behavior changed
- update durable docs when standards or architecture changed
- ensure `README.md` still points to the right developer workflows

## Release Risk Review

- route loading and deploy/update behavior considered
- no new sensitive data exposure introduced
- monitoring and error surfaces remain useful
- rollback path is understood for risky changes
