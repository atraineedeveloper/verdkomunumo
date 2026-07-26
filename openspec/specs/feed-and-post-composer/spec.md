# Feed And Post Composer

## Purpose

The feed and post composer are the highest-traffic surfaces in Verdkomunumo. They support public browsing, authenticated posting, category selection, image attachments, quoting, optimistic likes, and inspecting who liked a post.

## Requirements

### Requirement: Feed Pagination
The system SHALL load the feed in pages of a fixed size using infinite scroll, requesting the next page automatically as the user nears the end of the loaded list, and SHALL stop requesting further pages once a page returns fewer posts than the page size.

#### Scenario: Loading more posts
- GIVEN a feed page that returned a full page of posts
- WHEN the user scrolls near the bottom of the loaded list
- THEN the next page is requested and appended automatically

#### Scenario: Reaching the end
- GIVEN the most recent page returned fewer posts than the page size
- WHEN the user reaches the bottom
- THEN no further page requests are made

### Requirement: Feed Loading, Empty, And Error States
The system SHALL show a skeleton placeholder while the first page is loading, a background refresh indicator during subsequent refetches, an explicit empty-feed message when no posts match, and the error message when the feed query fails.

#### Scenario: No posts match the current filter
- GIVEN the "following" filter is active and the user follows no one
- WHEN the feed loads
- THEN an empty-feed message is shown instead of a skeleton or post list

### Requirement: Feed Filter Scope
The system SHALL support an "all" and a "following" feed filter, where "following" restricts results to posts by followed users and returns an empty page immediately if the user follows no one.

#### Scenario: Switching to the following filter
- GIVEN a user who follows at least one other user
- WHEN they switch the feed filter to "following"
- THEN only posts authored by followed users are shown

### Requirement: Post Composer Validation
The system SHALL require non-blank content (or at least one image or a quoted post), a selected category, and content within the maximum character length before enabling submission, and SHALL enforce a maximum number of attached images.

#### Scenario: Category missing
- GIVEN a composer with content typed but no category selected
- WHEN the user attempts to submit
- THEN the post button remains disabled and the post is not submitted

#### Scenario: Image limit exceeded
- GIVEN a user selects more images than the maximum allowed
- WHEN the selection is applied
- THEN only up to the maximum is kept and the user is notified that extra images were dropped

### Requirement: Post Submission Feedback
The system SHALL disable composer controls and show a loading indicator while a post is being submitted, and SHALL refresh the feed via query invalidation (rather than local optimistic insertion) once submission succeeds.

#### Scenario: Successful submission
- GIVEN a valid, non-empty composer
- WHEN the user submits
- THEN the composer resets, a success toast is shown, and the feed is refetched to include the new post

### Requirement: Like Toggle With Optimistic Update
The system SHALL optimistically toggle a post's liked state and like count in the feed cache when the like button is pressed, and SHALL roll back to the prior cached state and notify the user if the underlying request fails.

#### Scenario: Like request fails
- GIVEN a user taps the like button on a post
- WHEN the underlying like/unlike request fails
- THEN the feed reverts to its prior liked state and count, and an error is shown

### Requirement: Liker List Visibility
The system SHALL let a user reveal the list of people who liked a post through a dedicated summary/dialog that is independent of the like-toggle action, SHALL hide or skip fetching this list when the post has zero likes, and SHALL show its own loading, empty, and error states.

#### Scenario: Inspecting likers
- GIVEN a post with at least one like
- WHEN the user opens the liker list
- THEN the list of users who liked the post loads and displays without affecting the like button's own state

#### Scenario: Zero likes
- GIVEN a post with no likes
- WHEN the post is rendered
- THEN no liker-list summary is shown and no request for likers is made

### Requirement: Quoting A Post
The system SHALL let a user attach an existing post as a quote to a new post via the composer, showing a dismissible preview of the quoted post, and SHALL render a distinct "unavailable" placeholder on a post whose quoted post no longer resolves.

#### Scenario: Quoting from the feed
- GIVEN a user chooses to quote a visible post
- WHEN the composer opens with that post attached
- THEN a preview of the quoted post appears above the text area and can be cleared before submitting
