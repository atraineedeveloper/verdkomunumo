# Admin Moderation

## Summary

This flow covers moderator and admin access, dashboard entry, report handling, and category management permissions. The goal is to keep privileged tooling reliable while preventing unauthorized access.

## Scope

### In

- protected admin routes
- moderator dashboard and reports
- admin-only category management
- permission boundaries and redirects

### Out

- policy redesign
- new moderation models

## Business Rules

- moderator and admin routes must enforce role minimums
- category management remains admin-only
- unauthorized users must be redirected safely and consistently

## Verification

- Unit: protected-route and role helpers
- E2E: allowed and denied admin entry paths
- A11y: dashboard and reports minimum
- Visual: dashboard primary state
