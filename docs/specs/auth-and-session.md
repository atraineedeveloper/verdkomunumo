# Auth And Session

## Summary

Authentication and session continuity are foundational workflows in Verdkomunumo. The experience must remain stable across refreshes, auth callbacks, token refreshes, and protected-route transitions.

## Goals

- preserve authenticated UI continuity
- avoid guest/auth flicker
- support email, OAuth, and password reset flows
