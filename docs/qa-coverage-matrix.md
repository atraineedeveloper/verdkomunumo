# QA Coverage Matrix

This matrix helps decide what kind of verification each feature area should receive.

## Feature Areas

### Auth And Session

- unit: auth helpers, redirect helpers
- integration: provider state transitions, route guards
- E2E: login, register, reset-password, callback flows

### Feed And Composer

- unit: normalization, optimistic updates, editor/link helpers
- integration: composer interactions, quote flow, validation, image behavior
- E2E: create post, like, navigate to detail, public vs auth behavior

### Post Detail And Comments

- unit: comment threading, reply targeting, optimistic detail updates
- integration: comment form, edit/delete/report interactions
- E2E: route navigation, comment create/edit/delete, stale route recovery

### Messages And Notifications

- unit: message normalization and unread calculations
- integration: conversation list behavior, new conversation flow
- E2E: message navigation, notification-to-target behavior
