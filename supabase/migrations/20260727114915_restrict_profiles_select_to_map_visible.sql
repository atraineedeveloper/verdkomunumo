-- profiles_select previously used `USING (true)`, meaning every column of
-- every profile (including contact_email, social_links, and precise
-- location_lat/location_lng) was publicly queryable via the Supabase client
-- regardless of map_visible. The app's own `.eq('map_visible', true)` filter
-- in fetchMapUsers is a query convenience, not a security boundary, so this
-- closes the gap at the RLS layer: a profile is only readable by others once
-- its owner has explicitly opted into the map, or by its own owner always.
drop policy if exists "profiles_select" on "public"."profiles";

create policy "profiles_select" on "public"."profiles"
  for select
  using (auth.uid() = id or map_visible = true);
