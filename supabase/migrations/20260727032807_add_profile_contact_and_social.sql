-- Add optional public contact email and social links to profiles.
alter table "public"."profiles"
  add column "contact_email" text,
  add column "social_links" jsonb not null default '[]'::jsonb;
