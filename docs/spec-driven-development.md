# Spec-Driven Development

Verdkomunumo uses specification-driven development for medium and large changes, run through [OpenSpec](https://github.com/Fission-AI/OpenSpec) (`@fission-ai/openspec`).

This is not bureaucracy for its own sake. It is a tool to preserve quality while moving quickly, and to keep an AI assistant's plan visible and reviewable before code is written.

## Where Things Live

- `openspec/specs/<domain>/spec.md` — the source of truth for current, verified system behavior, organized by domain (`auth-and-session`, `feed-and-post-composer`, `post-detail-and-comments`, `comment-replies`, `messages-and-notifications`, `profiles-and-search`, `categories-and-taxonomy`, `settings-and-preferences`, `suggestions-and-feedback`, `admin-moderation`, `email-delivery-and-webhooks`).
- `openspec/changes/<id>/` — an in-progress change: `proposal.md` (why/what), `specs/` (delta requirements), `design.md` (how), `tasks.md` (checklist).
- `openspec/changes/archive/` — completed changes, kept for history.
- `openspec/config.yaml` — project context and per-artifact rules injected into every OpenSpec planning request (tech stack, i18n/auth/role conventions — see the file itself).
- `docs/project-stabilization-program.md` — recurring quality/tech-debt priorities. This is a tracking doc, not a behavior spec, and is not part of `openspec/`.

## When A Change Is Required

Run the OpenSpec workflow when the change:

- affects multiple screens or workflows
- changes auth, routing, caching, notifications, or moderation behavior
- introduces a new product surface
- changes data shape or requires migrations
- requires non-trivial testing strategy
- is large enough that implementation details may drift during work

A one-line fix or trivial typo does not need this ceremony.

## Workflow

In your AI assistant's chat (not the terminal):

1. `/opsx:explore` — optional, think through an unfamiliar area before proposing anything.
2. `/opsx:propose <change-name>` — drafts `proposal.md`, a delta spec under `openspec/changes/<change-name>/specs/`, `design.md`, and `tasks.md`.
3. Review the draft. Tighten vague requirements, add missing edge-case scenarios, confirm the delta type (`ADDED`/`MODIFIED`/`REMOVED`) is correct against the current spec.
4. Implement against `tasks.md`, running `/opsx:apply` to work through it (or implement manually and keep `tasks.md` in sync).
5. `/opsx:archive` — merges the delta into `openspec/specs/<domain>/spec.md` and files the change under `openspec/changes/archive/`.

From the terminal, use the CLI to inspect state:

```bash
openspec list                       # active changes
openspec show <change-name>         # view a change's artifacts
openspec validate <change-name> --strict   # check formatting before archiving
openspec validate --specs --all --strict   # check all specs are well-formed
```

## Writing A Good Requirement And Scenario

A spec requirement is one observable behavior with a `SHALL`/`MUST` (or `SHOULD` for a deliberate soft recommendation), followed by at least one `#### Scenario:` in GIVEN/WHEN/THEN form that actually exercises it — not a restatement of the requirement. Keep implementation detail (the how) out of the requirement; it belongs in `design.md` or the code itself.

Delta specs use three section types against the current spec: `## ADDED Requirements`, `## MODIFIED Requirements` (include the full new version), `## REMOVED Requirements`. Get this right — misclassifying a change as ADDED when it already exists produces two competing requirements in the archived spec.

## Brownfield Note

Do not bulk-rewrite a whole domain's spec just because you're touching a small corner of it. Let each real change's delta grow the relevant `openspec/specs/<domain>/spec.md` over time — that keeps specs honest and tied to verified behavior instead of aspirational documentation that drifts from reality.
