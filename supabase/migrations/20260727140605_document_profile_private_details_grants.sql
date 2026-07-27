-- The previous migration's CREATE TABLE already received these grants
-- implicitly from the project's default privileges (same class of
-- platform-implicit behavior as the rls_auto_enable event trigger).
-- Making them explicit here so `supabase db diff --linked` stays clean and
-- this table follows the same documented-grants pattern as every other
-- table in this schema. RLS (owner-only, see the previous migration) is
-- what actually restricts access -- these grants only enable the role to
-- be considered by RLS in the first place.
grant delete, insert, select, update on table "public"."profile_private_details" to "anon";
grant delete, insert, select, update on table "public"."profile_private_details" to "authenticated";
grant delete, insert, select, update on table "public"."profile_private_details" to "service_role";
