# Settings And Preferences

## Purpose

Settings let users manage their profile, map location, visibility, and appearance with explicit, understandable save behavior and no hidden side effects.
## Requirements
### Requirement: Profile Settings Explicit Save
The system SHALL require an explicit save action for profile field changes (username, display name, bio, website, contact email, social links, location fields), validating username format, length, and uniqueness, contact email format, and each social link's URL before saving, and SHALL show success or error feedback after the attempt.

#### Scenario: Username already taken by another account
- GIVEN a user changes their username to one already used by another profile
- WHEN they save
- THEN the save is rejected with a "username already in use" error and no change is persisted

#### Scenario: Invalid contact email
- GIVEN a user enters a value in the contact email field that is not a valid email address
- WHEN they attempt to save
- THEN the save is rejected with a validation error and no change is persisted

#### Scenario: Invalid social link URL
- GIVEN a user adds a social link with a non-URL value
- WHEN they attempt to save
- THEN the save is rejected with a validation error identifying that link and no change is persisted

#### Scenario: Saving with contact and social fields empty
- GIVEN a user leaves contact email and all social links blank
- WHEN they save other profile fields
- THEN the save succeeds and those fields remain unset

### Requirement: Map Visibility Requires Location
The system SHALL require at least one of country, region, or city to be set before a user can enable map visibility, geocoding the location and surfacing an explicit error if geocoding fails.

#### Scenario: Enabling map visibility without location
- GIVEN a user with no country, region, or city set
- WHEN they attempt to enable map visibility
- THEN the save is rejected with a message requiring a location first

### Requirement: Theme And Locale Autosave
The system SHALL apply a theme change immediately on selection without a separate save step, persisting it server-side, and SHALL apply a locale change immediately on the client without any server persistence.

#### Scenario: Switching theme
- GIVEN a user viewing the appearance settings
- WHEN they select a different theme
- THEN the theme is applied and saved immediately without needing a separate save button

### Requirement: Avatar Upload Optimization
The system SHALL optimize an uploaded avatar image (resizing and compressing) before storing it, replacing any existing avatar.

#### Scenario: Uploading a large avatar image
- GIVEN a user selects a high-resolution image as their avatar
- WHEN the upload is processed
- THEN the stored image is resized/compressed rather than stored at its original dimensions, and it replaces the previous avatar

