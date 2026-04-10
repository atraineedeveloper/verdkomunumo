# Profiles And Search

## Summary

This flow covers search, public profile pages, profile navigation, follow/unfollow, and opening posts from profile or search surfaces. The goal is to make discovery and user navigation dependable.

## Scope

### In

- search route behavior
- profile route rendering
- follow and unfollow interactions
- cross-navigation between results, profiles, and posts

### Out

- advanced ranking changes
- saved searches
- recommendation systems

## User Experience

- search results and profiles must load without dead ends
- users can move from search to profile to post detail without broken state
- follow/unfollow reflects quickly and recovers if it fails

## Business Rules

- follow actions require authentication
- profile pages remain publicly readable
- counts and follow state must stay coherent after optimistic updates

## Verification

- Unit: route helpers and follow-related logic if extracted
- E2E: search -> profile -> post navigation, follow/unfollow
- A11y: search page and profile page
- Visual: profile main state and empty search state
