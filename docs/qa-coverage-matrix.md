# QA Coverage Matrix

This matrix tracks what is already covered, what is missing, and what each flow must eventually satisfy.

Legend:

- `Yes`: implemented and usable now
- `Partial`: some coverage exists but not enough to close the flow
- `No`: missing

| Flow | Spec | Unit / Integration | Smoke | Functional E2E | A11y | Visual | Sentry-ready | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth and session | Yes | Yes | Partial | Yes | Yes | Yes | Partial | Hardened |
| Feed and post composer | Yes | Yes | Partial | Partial | Partial | Partial | Partial | Guest baseline in place |
| Post detail and comments | Yes | Partial | No | No | No | No | Partial | In progress |
| Profiles and search | Yes | No | Partial | No | No | No | Partial | Planned |
| Messages and notifications | Yes | Partial | No | No | No | No | Partial | Planned |
| Settings and preferences | Yes | No | No | No | No | No | Partial | Planned |
| Admin moderation | Yes | Partial | No | No | No | No | Partial | Planned |
| Categories and taxonomy | Yes | Partial | No | No | No | No | Partial | Planned |
| Email delivery and webhooks | Yes | Partial | No | No | No | No | Partial | Planned |
| Suggestions and feedback | Yes | No | No | No | No | No | Partial | Planned |

## Current mapping to implemented checks

### Vitest

- `src/lib/auth.test.ts`
- `src/providers/AuthProvider.test.tsx`
- `src/layouts/ProtectedRoute.test.tsx`
- `src/lib/query/optimisticPosts.test.ts`
- `src/lib/comments.test.ts`
- other helper-focused tests in `src/lib/`

### Playwright smoke

- public routes in `tests/e2e/smoke.spec.ts`

### Playwright visual

- login page
- register page
- forgot password page
- reset password page

### Playwright a11y

- feed
- login
- register
- forgot password
- reset password

## Current status notes

- Auth and session is beyond the initial stabilization pass: callback, redirect safety, recovery, reset, and the main public auth pages are now covered by tests.
- Feed and post composer currently has the guest path stabilized with functional and visual checks, but the authenticated composer path is still only partially covered.

## Immediate next additions

### Auth and session

- expand regression coverage around auth callback, safe redirect, and reset edge cases
- keep the existing visual and a11y baselines current when auth pages change

### Feed and post composer

- extend beyond the guest feed baseline into authenticated composer behavior
- add more coverage for likes, edit/delete, quoted posts, and optimistic rollback
- keep the current guest visual baseline current when feed layout changes

### Post detail and comments

- smoke entry for post detail using a stable fixture or seeded record
- functional E2E for comment and reply flows
- a11y and visual baselines for comment thread rendering
