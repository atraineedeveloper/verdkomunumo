# Documentation Governance

This document defines how Verdkomunumo keeps documentation accurate, durable, and useful under continuous product change.

## Purpose

Documentation is part of the system, not an afterthought.

Its job is to:

- reduce architectural drift
- make implementation decisions legible
- preserve context across time
- improve the quality of human and AI-assisted changes

## Document Classes

### Operational Rules

`RULES.md`

Use for short execution constraints that should immediately influence implementation behavior.

### Durable Engineering Guidance

`docs/*.md`

Use for architecture, standards, testing, security, performance, and engineering process.

### Feature Specs

`docs/specs/*.md`

Use for product or technical changes that require durable scope, behavior, and verification notes.

## Update Triggers

Documentation must be reviewed when a change affects:

- architecture
- auth behavior
- query/cache patterns
- testing requirements
- user-visible workflows
- deployment or operational assumptions

## Review Standard

Good documentation in this repo should be:

- accurate
- specific
- scoped
- readable
- enforceable where possible
- aligned with actual repository behavior

## Anti-Patterns

- generic advice that does not match the repo
- stale behavior descriptions
- undocumented exceptions
- process guidance with no operational consequence
- duplicated guidance that diverges over time

## Legacy Exceptions

When the repo contains known debt that cannot be removed immediately, track it explicitly.

For executable quality guardrails, temporary exceptions belong in `quality-baseline.json`.

That file should be treated as a debt register:

- additions require justification
- removals should happen as soon as debt is paid down
- it should trend smaller over time
