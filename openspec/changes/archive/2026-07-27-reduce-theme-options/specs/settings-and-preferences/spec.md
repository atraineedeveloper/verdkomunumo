## MODIFIED Requirements

### Requirement: Theme And Locale Autosave
The system SHALL apply a theme change immediately on selection without a separate save step, persisting it server-side, and SHALL apply a locale change immediately on the client without any server persistence. The set of selectable locales SHALL be limited to Esperanto and English. The set of selectable themes SHALL be limited to green and dark.

#### Scenario: Switching theme
- GIVEN a user viewing the appearance settings
- WHEN they select a different theme
- THEN the theme is applied and saved immediately without needing a separate save button

#### Scenario: Only Esperanto and English are offered
- GIVEN a user viewing the language picker in appearance settings
- WHEN the list of selectable languages renders
- THEN only Esperanto and English are shown, with no other language options

#### Scenario: A previously saved locale is no longer supported
- GIVEN a user whose browser has a saved locale preference that is neither Esperanto nor English
- WHEN they load the app
- THEN the app falls back to Esperanto rather than erroring, and the user can pick English again from the language picker

#### Scenario: Only green and dark themes are offered
- GIVEN a user viewing the theme picker in appearance settings
- WHEN the list of selectable themes renders
- THEN only green and dark are shown, with no other theme options

#### Scenario: A previously saved theme is no longer supported
- GIVEN a user whose profile has a saved theme that is neither green nor dark
- WHEN they load the app
- THEN the app falls back to green rather than erroring, and the user can pick dark again from the theme picker
