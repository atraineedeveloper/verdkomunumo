# Vibe Coding Playbook

This document defines how Verdkomunumo can use AI-assisted development without letting the repository drift into chaos.

## What "Good Vibe Coding" Means Here

Good vibe coding is:

- fast
- iterative
- spec-aware
- constrained by standards
- verified before trust

Bad vibe coding is:

- pasting large changes without understanding boundaries
- accepting hidden `any` and brittle state logic
- skipping docs because "it works locally"
- letting giant files absorb every new feature

## Operating Rules

### Before Coding

For medium and large work:

1. read `RULES.md`
2. read the relevant docs in `docs/`
3. read the nearest existing feature spec
4. decide whether a new or updated spec is needed

### During Coding

- keep changes scoped
- follow the existing architecture unless the task explicitly includes architectural change
- do not introduce a new pattern casually if one already exists
- prefer editing the relevant boundary instead of layering hacks around it

### After Coding

- run the relevant checks
- review the diff for accidental complexity
- update docs/specs if behavior or standards changed
- record follow-up debt if you intentionally defer something

## Prompting Guidance For AI Agents

When asking an AI agent to implement work, include:

- the user problem
- the desired outcome
- files or feature areas involved
- constraints from `RULES.md`
- whether the change should preserve existing UI patterns
- what tests or verification are expected

## Review Checklist For AI-Generated Changes

Review the output for:

- incorrect query invalidation
- duplicated Supabase logic
- state being copied instead of derived
- missing loading/error states
- hardcoded strings
- mojibake or encoding corruption
- file size blow-up
- tests missing for risky paths

## Definition Of Done For AI-Assisted Work

A change is done only when:

- behavior is correct
- important states are handled
- standards are respected
- tests or verification are performed
- docs/specs are still accurate
