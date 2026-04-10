# Email Delivery And Webhooks

## Summary

This flow covers product emails, notification delivery queueing, the Supabase edge function path, and webhook-based delivery. The goal is to make notification email behavior observable and safe to operate.

## Scope

### In

- notification email queue lifecycle
- edge function deployment assumptions
- webhook payload expectations
- unsubscribe-link preference handling

### Out

- full transactional email redesign
- provider abstraction beyond the current setup

## Business Rules

- delivery queue rows must remain the trigger source
- webhook authentication must stay explicit
- unsubscribe flows must map to known notification types only

## Verification

- Unit: email preference helpers and notification-type guards
- Integration: edge function payload handling
- Manual assisted: webhook path and provider delivery checks
- Observability: failures should be traceable in logs/Sentry where applicable
