# Suggestions And Feedback

## Summary

This flow covers the floating suggestion button and feedback capture path. The goal is to keep user-reported issues easy to send and easy to interpret during stabilization.

## Scope

### In

- floating suggestion entry point
- feedback modal or submission path
- accessibility and mobile placement

### Out

- external support tooling migrations
- advanced triage automation

## Business Rules

- the entry point must remain reachable but not block core navigation
- submission should fail gracefully and preserve user input whenever possible

## Verification

- E2E: open suggestion flow and submit/cancel
- A11y: floating action and form controls
- Visual: mobile and desktop placement
