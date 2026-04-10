# Settings And Preferences

## Summary

This flow covers profile editing, avatar upload, theme selection, locale selection, and email notification preferences. The goal is to make personal settings safe to edit, easy to understand, and resilient to partial saves.

## Scope

### In

- profile fields
- avatar upload path
- theme and locale controls
- email notification preferences and unsubscribe-linked states

### Out

- account deletion
- billing and subscription settings

## User Experience

- settings load with a complete editable state
- save operations show clear pending, success, and error feedback
- unsubscribe links land on a pre-highlighted preference state

## Business Rules

- username must remain unique
- avatar upload must not silently lose the previous profile state
- disabled master email preference should disable child toggles coherently

## Verification

- Unit: email preference helpers and form transformation helpers where possible
- E2E: edit profile fields, save preferences, toggle email settings
- A11y: settings page controls
- Visual: profile section and email preference section
