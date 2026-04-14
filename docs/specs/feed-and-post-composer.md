# Feed And Post Composer

## Summary

The feed and post composer form the highest-traffic part of the application. They must support public browsing, authenticated posting, likes, quoting, media handling, and resilient async feedback.

## Goals

- fast and readable feed loading
- reliable optimistic interactions
- clear composer states
- post cards can reveal the list of users who liked a post without breaking the existing like toggle

## Current Notes

- the like toggle remains the primary action on the heart button
- when a post already has likes, the feed exposes a secondary action to inspect the liker list
- liker inspection must have explicit loading, empty, and error states
