# QA Coverage Matrix

This matrix helps decide what kind of verification each feature area should receive.

## Feature Areas

### Auth And Session

- unit: auth helpers, redirect helpers
- integration: provider state transitions, route guards
- E2E: login, register, reset-password, callback flows

### Settings And Preferences

- unit: profile payload building, username validation, geocoding helpers
- integration: profile/appearance section save behavior, map-visibility validation
- E2E: edit and save profile fields, toggle map visibility, switch theme/locale

### Map-Only Experience

- unit: map data normalization
- integration: opted-in member rendering, guest vs authenticated map access
- E2E: guest browses the map, authenticated member appears after enabling visibility
