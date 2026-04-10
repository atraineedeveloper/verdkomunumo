# Auth And Session

## Summary

This flow covers login, registration, auth callback, session restoration, safe redirects, password recovery, and password reset. The goal is to make authentication predictable, secure, and resilient to delayed auth state or partial failures.

## Current Status

- The auth/session block is already hardened in the app and has dedicated callback, reset, and redirect coverage.
- The remaining work here is mostly regression-proofing and keeping future auth changes aligned with the existing contract.

## Scope

### In

- login and registration forms
- Google OAuth entry points
- auth callback handling
- safe redirect behavior
- forgot password and reset password
- session restoration and protected-route behavior

### Out

- account deletion
- multi-factor auth
- advanced provider management

## User Experience

- unauthenticated users can reach public routes without crashes
- protected routes redirect to login and preserve a safe `next`
- successful auth returns users to the intended route
- auth callback shows a loading state and recovers cleanly on failure
- password recovery and reset flows are understandable and non-blocking

## Business Rules

- redirects must always pass through `safeRedirect`
- protected routes cannot leak private content before auth is resolved
- callback failures redirect back to login with a recoverable state
- session loading must render a stable loading UI instead of a broken page

## Data And Contracts

- Supabase auth session is the source of truth
- route params and `next` query values must be validated before navigation
- auth-related pages should rely on shared validation and toast/error conventions

## Error And Edge Cases

- delayed session initialization
- invalid or unsafe `next` values
- expired password reset links
- OAuth callback exchange failure
- authenticated user opening auth pages directly

## Acceptance Criteria

- login, register, forgot password, reset password, and callback all render a stable loading or success path
- protected routes redirect safely for guests
- callback success and failure paths are covered
- auth pages remain usable on mobile and desktop

## Verification

- Unit: redirect and auth helpers
- Integration: provider/session restoration behavior
- E2E: auth entry, callback, redirect, recovery, reset
- A11y: all auth pages
- Visual: login, register, forgot, reset

## Notes

- This is the first stabilization block because session problems amplify bugs everywhere else.
