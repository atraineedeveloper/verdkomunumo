# Security And Privacy

Verdkomunumo handles community identity and personal profile/location data. Security decisions must match that reality.

## Core Principles

- trust the database and RLS more than the client
- never treat UI hiding as authorization
- minimize secret exposure
- treat structured location data as sensitive; map visibility must stay opt-in

## Auth Rules

- auth state transitions must be explicit and resilient
- sensitive routes must still be protected by data-layer controls (RLS), not just client-side gating

## Supabase

- secrets must not be committed
- service-role credentials are for trusted server or tooling contexts only
- edge functions must validate expected inputs

## Review Triggers

Require extra review for changes involving:

- auth/session logic
- direct SQL or migration work
- file uploads
- map visibility / location data handling
