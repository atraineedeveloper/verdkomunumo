# Project Stabilization Program

## Summary

Verdkomunumo will be stabilized as a continuous program, not as isolated bug fixes. The working model is:

- prioritize the user-facing core first;
- close work by critical flow, not by random page edits;
- require a spec before medium or large changes;
- treat testing, accessibility, visual stability, and monitoring as part of feature completion.

## Current Status

- Auth and session is hardened and now has functional, accessibility, and visual coverage in place.
- Feed and post composer has guest browsing coverage and guest-facing visual baseline in place, but authenticated composer behavior is still only partially covered.
- The remaining work is now about closing the next flows in order, not re-litigating the auth block.

## Priority Order

The stabilization order is fixed unless product priorities change:

1. Auth and session
2. Feed and post composer
3. Post detail and comments
4. Profiles and search
5. Messages and notifications
6. Settings and preferences
7. Admin moderation
8. Support systems: categories, email, suggestions, monitoring, webhooks

## Current Product Surface

### Public and mixed-access routes

- landing
- feed
- search
- profile
- category
- post detail
- login
- register
- forgot password
- reset password
- auth callback

### Private core routes

- notifications
- messages
- conversation
- community chat
- settings

### Admin routes

- admin dashboard
- admin reports
- admin categories

### Cross-cutting systems

- Supabase auth and redirects
- optimistic updates
- storage uploads
- email preferences
- edge email delivery
- suggestion flow
- Sentry and observability

## Definition Of Stable

A flow is considered stabilized only when all of the following are true:

- a decision-complete spec exists in `docs/specs/`;
- smoke coverage exists for the route or flow entry;
- key functional behavior is covered in Vitest or Playwright;
- accessibility checks pass with no `critical` issues;
- visual baselines exist for the important states when visual drift matters;
- known failures, loading states, empty states, and permission boundaries were explicitly reviewed;
- production-relevant errors are observable through Sentry when applicable;
- CI includes the checks needed to catch regressions in that flow.

## Iteration Plan

### Iteration 1: Program Base

- create the stabilization program doc;
- create specs for the first critical flows;
- define the QA coverage matrix;
- map current test gaps against the actual route surface.

### Iteration 2: Auth And Session

- hardened callback handling, redirect safety, recovery, reset, and loading/error behavior;
- auth smoke, functional, a11y, and visual coverage are now in place for the main pages;
- remaining work is limited to polish and future regressions.

### Iteration 3: Feed And Publication

- guest feed loading, CTA behavior, and core visual baseline are in place;
- authenticated composer, likes, edit/delete, quoted posts, media, and optimistic behavior are still partial;
- the next work is to finish the authenticated side without losing the guest baseline.

### Iteration 4: Post Detail And Comments

- stabilize threaded comments, likes, edit/delete, counts, and loading/failure behavior;
- cover edge cases around replies and parent-child integrity;
- baseline thread rendering.

### Iteration 5: Profiles, Search, Messages, Notifications, Settings

- close the main private and cross-navigation journeys;
- cover list/detail transitions and error handling;
- connect stabilized flows to Sentry tags and release checks.

### Iteration 6: Admin And Support Systems

- harden role gates, moderation paths, categories, and dashboard behavior;
- review email delivery, edge function flow, and webhook assumptions;
- close remaining secondary-system gaps.

## Current QA Baseline

### Already present

- Vitest coverage for several libs, auth helpers, auth provider, and optimistic updates
- Playwright smoke coverage for public routes
- Playwright functional coverage for auth callback, safe redirects, and recovery/reset paths
- Playwright visual coverage for login, register, and recovery/reset pages
- Playwright a11y coverage for feed, login, register, and recovery/reset pages
- CI workflow running typecheck, unit, build, smoke, visual, and a11y
- Sentry initialization and build plugin prepared but still env-driven

### Main current gaps

- feed/publication is only partially covered beyond the guest surface
- no route coverage yet for the later private flows in E2E
- visual coverage still needs to expand beyond the main stabilization blocks
- no explicit stabilization tracker for loading, empty, and error states per flow
- no operational checklist for "this flow is ready to move on"

## Acceptance Rules For The Program

- Every medium/large feature or stabilization effort starts with a spec.
- Every meaningful fix leaves stronger coverage than before.
- A flow cannot be marked complete by code changes alone.
- CI remains the minimum automated gate, not the full quality strategy.
- Sentry is required for production-facing observability once its envs are configured.

## Working Files

- flow specs live in `docs/specs/`
- reusable format lives in `docs/templates/spec-template.md`
- coverage tracking lives in `docs/qa-coverage-matrix.md`

## Notes

- This program intentionally starts with the user-facing core because defects there have the highest product cost.
- Admin and support systems are still required, but they should not block stabilization of the primary user journeys.
