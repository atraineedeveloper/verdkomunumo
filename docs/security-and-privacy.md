# Security And Privacy

Verdkomunumo handles community identity, messaging, moderation workflows, and personal profile data. Security decisions must match that reality.

## Core Principles

- trust the database and RLS more than the client
- never treat UI hiding as authorization
- minimize secret exposure
- preserve auditability for moderation-sensitive changes

## Auth Rules

- auth state transitions must be explicit and resilient
- never assume a client role check replaces backend enforcement
- sensitive routes must still be protected by data-layer controls

## Supabase

- secrets must not be committed
- service-role credentials are for trusted server or tooling contexts only
- edge functions and admin tooling must validate expected inputs

## Review Triggers

Require extra review for changes involving:

- auth/session logic
- roles and admin workflows
- direct SQL or migration work
- webhooks
- email flows
- file uploads
- conversation and notification delivery
