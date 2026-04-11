# Spec-Driven Development

Verdkomunumo uses specification-driven development for medium and large changes.

This is not bureaucracy for its own sake. It is a tool to preserve quality while moving quickly.

## When A Spec Is Required

Write or update a spec when the change:

- affects multiple screens or workflows
- changes auth, routing, caching, notifications, or moderation behavior
- introduces a new product surface
- changes data shape or requires migrations
- requires non-trivial testing strategy
- is large enough that implementation details may drift during work

## Spec Workflow

1. Define the problem.
2. Define user-visible goals.
3. Define explicit non-goals.
4. Describe the states and flows.
5. Identify data dependencies and constraints.
6. Define risks and edge cases.
7. Define validation and rollout expectations.
8. Implement against the spec.
9. Update the spec if reality changes.

## Required Sections

Use the template in [templates/spec-template.md](./templates/spec-template.md).

The minimum expected sections are:

- summary
- goals
- non-goals
- user flows
- data and technical notes
- risks
- testing and verification
- rollout or follow-up notes
