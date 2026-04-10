# Categories And Taxonomy

## Summary

This flow covers active category loading, category pages, category labels in posts, and admin-side category management. The goal is to keep taxonomy readable and coherent across browsing and publication.

## Scope

### In

- category route rendering
- category tags in feed and post views
- category lists used by composer and admin tools

### Out

- taxonomy redesign
- multi-category posts

## Business Rules

- inactive categories should not appear as active posting options
- category ordering should remain stable where configured

## Verification

- Unit: category helper logic if extracted
- E2E: open category page and navigate back to posts
- Visual: category listing state
