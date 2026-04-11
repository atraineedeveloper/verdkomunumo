# i18n Standards

Verdkomunumo is multilingual and community-facing. Language quality is product quality.

## Core Rules

- all user-facing product strings should come from the translation layer
- translation source files must be saved and preserved as UTF-8
- text corruption is treated as a bug
- adding a feature without translation support is incomplete unless the scope explicitly says otherwise

## Supported Locales

The project currently tracks these locales in the translation layer:

- Esperanto
- Spanish
- English
- Portuguese
- Japanese
- French
- German
- Korean
- Chinese

## Source Of Truth

The translation dictionary is the source of truth for product copy.

When adding new text:

1. add a stable translation key
2. add the base translation content
3. add translations or temporary fallbacks according to the agreed workflow
4. use the key in the UI

## Encoding Rules

- never paste text from a source that changes encoding silently
- if a file shows obvious mojibake or garbled UTF-8 text, fix the file instead of adding more content around it
- review diffs for text corruption when editing translation-heavy files

## Testing And Verification

At minimum verify:

- no mojibake in modified views
- layout still works for longer strings
- buttons, placeholders, toasts, and empty states are translated
- route titles and dialog labels are translated where applicable
