# Post Detail And Comments

## Summary

The post detail route supports deep linking, comments, nested replies, reports, edits, and interaction history. It is both a content page and a workflow-heavy feature surface.

## Goals

- reliable route loading
- threaded comments with clear reply targeting
- cache consistency between detail and feed views
- users can inspect who liked the main post and individual comments

## Current Notes

- post and comment likes remain separate from the like toggle action
- liker lists should reuse the same query and modal pattern across post detail and comments
- comment liker inspection should not interfere with reply, edit, delete, or report flows
