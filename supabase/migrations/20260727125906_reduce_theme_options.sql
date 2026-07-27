-- Reduce selectable themes to green and dark.
-- Backfill any row on a removed theme before narrowing the check constraint,
-- otherwise ADD CONSTRAINT fails against still-violating rows.
update "public"."profiles"
  set theme = 'green'
  where theme in ('vivid', 'minimal');

alter table "public"."profiles"
  drop constraint if exists "profiles_theme_check";

alter table "public"."profiles"
  add constraint "profiles_theme_check" check (theme in ('green', 'dark'));
