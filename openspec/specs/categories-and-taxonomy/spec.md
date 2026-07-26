# Categories And Taxonomy

## Purpose

Categories organize public discussion and must present consistent icons, colors, and translated labels everywhere a regular user encounters them: feed, post detail, composer, profile, and search.

## Requirements

### Requirement: Required Category On Post Composer
The system SHALL require a category to be selected before a post can be submitted, defaulting the selection to a provided default or the first available category rather than leaving it blank.

#### Scenario: No category available to submit without one
- GIVEN the post composer is open
- WHEN it renders
- THEN a category is already selected by default, and clearing it disables submission

### Requirement: Consistent Category Presentation On User-Facing Surfaces
The system SHALL use the same shared icon and color mapping, and the same translated label key, for a given category across the sidebar, feed, category page, post detail, profile, search, and composer.

#### Scenario: Same category shown in feed and post detail
- GIVEN a post with a given category
- WHEN it is viewed in the feed and then on its detail page
- THEN the category's icon, color, and translated label are identical in both places

### Requirement: Admin Category Management Uses Raw Fields
The system SHALL let admins manage category name, color, and icon directly through the admin categories page using the values stored in the database, without applying the shared icon/color mapping or the `t('cat_name_...')` translation used on user-facing surfaces.

#### Scenario: Admin renames a category
- GIVEN an admin edits a category's stored name
- WHEN the change is saved
- THEN the admin page reflects the raw stored name immediately, independent of the translated label shown to regular users until translations are updated separately
