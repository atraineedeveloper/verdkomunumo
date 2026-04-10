# Messages And Notifications

## Summary

This flow covers inbox lists, conversation detail, unread counts, refresh behavior, community chat, and notification reading surfaces. The goal is to make private communication reliable under changing realtime and auth conditions.

## Scope

### In

- notifications list
- messages list
- conversation detail
- community chat
- unread counters in nav surfaces

### Out

- advanced moderation tooling for chat
- delivery guarantees beyond the current backend model

## User Experience

- private routes should load behind a stable auth gate
- list and detail transitions should not leave blank or stuck states
- unread indicators should be legible and consistent

## Business Rules

- these routes require authentication
- unread counts should reconcile after read/navigation actions
- route transitions must not expose broken placeholders or stale counters

## Verification

- Unit: presence and message helper utilities
- E2E: open notifications, messages, conversation, and return navigation
- A11y: messages and notifications entry routes
- Visual: inbox and conversation primary states
