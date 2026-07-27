-- profiles_select now hides rows where map_visible = false from anyone but
-- their owner, which broke the username-availability prechecks in
-- registration and settings: they went blind to usernames belonging to
-- hidden profiles, so a real collision would only surface as a raw unique
-- constraint violation instead of a friendly error. This RPC checks
-- availability with elevated privileges, returning only a boolean (no
-- profile data), so it can be called safely by anon/authenticated regardless
-- of the target row's map_visible.
create or replace function public.is_username_available(check_username text, exclude_id uuid default null)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles
    where username = check_username
      and (exclude_id is null or id <> exclude_id)
  );
$$;

revoke all on function public.is_username_available(text, uuid) from public;
grant execute on function public.is_username_available(text, uuid) to anon, authenticated;
