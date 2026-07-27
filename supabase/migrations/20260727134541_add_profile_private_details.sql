-- Strictly private per-profile fields (sex, birth date). Unlike profiles,
-- this table's RLS has no map_visible clause at all: only the owner can
-- ever read their own row, via any access path including direct API calls.
create table "public"."profile_private_details" (
  "id" uuid primary key references "public"."profiles"("id") on delete cascade,
  "sex" text check ("sex" in ('male', 'female')),
  "birth_date" date,
  "updated_at" timestamptz not null default now()
);

alter table "public"."profile_private_details" enable row level security;

create policy "profile_private_details_select_own" on "public"."profile_private_details"
  for select
  using (auth.uid() = id);

create policy "profile_private_details_insert_own" on "public"."profile_private_details"
  for insert
  with check (auth.uid() = id);

create policy "profile_private_details_update_own" on "public"."profile_private_details"
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
