# Verdkomunumo Documentation

This directory is the operating manual for Verdkomunumo.

It exists for two audiences:

- humans making product and engineering decisions
- AI coding agents helping implement, review, and maintain the project

The goal is to support fast iteration without uncontrolled technical debt.

## How To Use This Directory

Read these documents in this order when starting significant work:

1. [engineering-principles.md](./engineering-principles.md)
2. [architecture.md](./architecture.md)
3. [coding-standards.md](./coding-standards.md)
4. [testing-standards.md](./testing-standards.md)
5. [i18n-standards.md](./i18n-standards.md)
6. [performance-and-reliability.md](./performance-and-reliability.md)
7. [security-and-privacy.md](./security-and-privacy.md)
8. [spec-driven-development.md](./spec-driven-development.md)
9. [vibe-coding-playbook.md](./vibe-coding-playbook.md)
10. [documentation-governance.md](./documentation-governance.md)
11. [review-and-release-checklist.md](./review-and-release-checklist.md)

## Directory Structure

- [engineering-principles.md](./engineering-principles.md)
  Project values, non-negotiables, and decision criteria.
- [architecture.md](./architecture.md)
  Current technical architecture and expected module boundaries.
- [coding-standards.md](./coding-standards.md)
  Rules for TypeScript, React, Supabase access, query handling, and file organization.
- [testing-standards.md](./testing-standards.md)
  Testing expectations, required coverage by feature type, and review gates.
- [i18n-standards.md](./i18n-standards.md)
  Language, encoding, translations, and text handling rules.
- [performance-and-reliability.md](./performance-and-reliability.md)
  Bundle, PWA, caching, loading, and resilience guidance.
- [security-and-privacy.md](./security-and-privacy.md)
  Security expectations for auth, data access, secrets, and moderation-sensitive features.
- [spec-driven-development.md](./spec-driven-development.md)
  The process for writing specs before medium and large changes.
- [qa-coverage-matrix.md](./qa-coverage-matrix.md)
  A practical map of what kinds of tests and checks each feature area should have.
- [vibe-coding-playbook.md](./vibe-coding-playbook.md)
  How to move quickly with AI assistance without degrading the codebase.
- [documentation-governance.md](./documentation-governance.md)
  Ownership, change triggers, and quality expectations for docs themselves.
- [review-and-release-checklist.md](./review-and-release-checklist.md)
  Practical merge and release checklist aligned with the repo standards.
- [templates/spec-template.md](./templates/spec-template.md)
  Reusable spec template for new work.
- [specs/](./specs)
  Feature-level specifications and stabilization plans.

## Change Policy

Update documentation when any of the following changes:

- architecture or data flow
- coding conventions
- test expectations
- auth or security behavior
- bundle or deployment strategy
- feature scope or product workflows

A feature is not fully done if the code changes but the relevant durable documentation remains wrong.

## Intended Relationship With `RULES.md`

`docs/` contains the long-form explanation.

`RULES.md` contains short, high-signal operational constraints that should influence implementation immediately.

When both exist:

- `RULES.md` wins for concise execution rules
- `docs/` explains the why, examples, and decision boundaries
