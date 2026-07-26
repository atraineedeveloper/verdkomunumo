-- Remove social-network schema.
-- Scope cut: keep only auth, profile settings, and the member map.

-- 1. Drop policies that reference columns we are about to drop.
drop policy if exists "profiles_update_own" on "public"."profiles";

-- 2. Drop tables, children before parents.
drop table if exists "public"."notification_push_deliveries";
drop table if exists "public"."notification_devices";
drop table if exists "public"."notification_email_deliveries";
drop table if exists "public"."content_reports";
drop table if exists "public"."notifications";
drop table if exists "public"."likes";
drop table if exists "public"."comments";
drop table if exists "public"."messages";
drop table if exists "public"."conversation_participants";
drop table if exists "public"."conversations";
drop table if exists "public"."posts";
drop table if exists "public"."categories";
drop table if exists "public"."follows";
drop table if exists "public"."community_messages";
drop table if exists "public"."app_suggestions";
drop table if exists "public"."category_suggestions";

-- 3. Drop functions that only served the tables above.
drop function if exists "public"."handle_category_post_count"();
drop function if exists "public"."handle_comment_count"();
drop function if exists "public"."handle_comment_like"();
drop function if exists "public"."handle_comment_mention_notifications"();
drop function if exists "public"."handle_comment_notification"();
drop function if exists "public"."handle_comment_soft_delete"();
drop function if exists "public"."handle_conversation_update"();
drop function if exists "public"."handle_follow"();
drop function if exists "public"."handle_message_notification"();
drop function if exists "public"."handle_post_like"();
drop function if exists "public"."handle_post_mention_notifications"();
drop function if exists "public"."handle_post_quote_notifications"();
drop function if exists "public"."handle_post_soft_delete"();
drop function if exists "public"."handle_profile_post_count"();
drop function if exists "public"."invoke_notification_email_delivery"();
drop function if exists "public"."is_conversation_participant"("uuid");
drop function if exists "public"."push_notifications_enabled_for_type"("public"."profiles", "text");
drop function if exists "public"."queue_notification_email_delivery"();
drop function if exists "public"."queue_notification_push_delivery"();
drop function if exists "public"."touch_notification_device_updated_at"();
drop function if exists "public"."touch_notification_push_delivery_updated_at"();
drop function if exists "public"."validate_comment_reply"();
drop function if exists "public"."create_conversation_with_participant"("uuid");

-- 4. Drop profile columns that only supported the removed features.
alter table "public"."profiles"
  drop column if exists "role",
  drop column if exists "followers_count",
  drop column if exists "following_count",
  drop column if exists "posts_count",
  drop column if exists "email_notifications_enabled",
  drop column if exists "email_notify_like",
  drop column if exists "email_notify_comment",
  drop column if exists "email_notify_follow",
  drop column if exists "email_notify_message",
  drop column if exists "email_notify_mention",
  drop column if exists "email_notify_category_approved",
  drop column if exists "email_notify_category_rejected",
  drop column if exists "push_notifications_enabled",
  drop column if exists "push_notify_like",
  drop column if exists "push_notify_comment",
  drop column if exists "push_notify_follow",
  drop column if exists "push_notify_message",
  drop column if exists "push_notify_mention",
  drop column if exists "push_notify_category_approved",
  drop column if exists "push_notify_category_rejected";

-- 5. Recreate profiles_update_own without the role self-escalation clause.
create policy "profiles_update_own" on "public"."profiles"
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
