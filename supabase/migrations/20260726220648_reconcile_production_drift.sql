drop policy "participants_insert_own" on "public"."conversation_participants";

drop policy "profiles_update_own" on "public"."profiles";

alter table "public"."notification_push_deliveries" drop constraint "notification_push_deliveries_type_check";

alter table "public"."notifications" drop constraint "notifications_type_check";

alter table "public"."profiles" drop column "location";

alter table "public"."profiles" add column "city" text;

alter table "public"."profiles" add column "country" text;

alter table "public"."profiles" add column "location_lat" double precision;

alter table "public"."profiles" add column "location_lng" double precision;

alter table "public"."profiles" add column "map_visible" boolean default false;

alter table "public"."profiles" add column "region" text;

CREATE UNIQUE INDEX idx_notifications_unique_quote_event ON public.notifications USING btree (user_id, actor_id, type, post_id) WHERE ((type = 'quote'::text) AND (post_id IS NOT NULL));

CREATE INDEX idx_profiles_country_region ON public.profiles USING btree (country, region);

CREATE INDEX idx_profiles_map_visible ON public.profiles USING btree (map_visible) WHERE (map_visible = true);

alter table "public"."notification_push_deliveries" add constraint "notification_push_deliveries_type_check" CHECK ((type = ANY (ARRAY['like'::text, 'comment'::text, 'follow'::text, 'message'::text, 'mention'::text, 'quote'::text, 'category_approved'::text, 'category_rejected'::text]))) not valid;

alter table "public"."notification_push_deliveries" validate constraint "notification_push_deliveries_type_check";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['like'::text, 'comment'::text, 'follow'::text, 'message'::text, 'mention'::text, 'quote'::text, 'category_approved'::text, 'category_rejected'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_conversation_with_participant(target_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_conversation_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF target_user_id IS NULL OR target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Invalid participant';
  END IF;

  INSERT INTO public.conversations DEFAULT VALUES
  RETURNING id INTO new_conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES
    (new_conversation_id, auth.uid()),
    (new_conversation_id, target_user_id);

  RETURN new_conversation_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_comment_soft_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.is_deleted IS DISTINCT FROM OLD.is_deleted THEN
    IF NEW.is_deleted THEN
      UPDATE public.posts
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = NEW.post_id;
    ELSE
      UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_post_quote_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  quoted_owner_id UUID;
BEGIN
  IF NEW.quoted_post_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO quoted_owner_id
  FROM public.posts
  WHERE id = NEW.quoted_post_id;

  IF quoted_owner_id IS NOT NULL AND quoted_owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, message)
    VALUES (
      quoted_owner_id,
      NEW.user_id,
      'quote',
      NEW.id,
      LEFT(NEW.content, 180)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_post_soft_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.is_deleted IS DISTINCT FROM OLD.is_deleted THEN
    IF NEW.is_deleted THEN
      UPDATE public.profiles
        SET posts_count = GREATEST(posts_count - 1, 0)
        WHERE id = NEW.user_id;
      UPDATE public.categories
        SET post_count = GREATEST(post_count - 1, 0)
        WHERE id = NEW.category_id;
    ELSE
      UPDATE public.profiles
        SET posts_count = posts_count + 1
        WHERE id = NEW.user_id;
      UPDATE public.categories
        SET post_count = post_count + 1
        WHERE id = NEW.category_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.invoke_notification_email_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://zywsptwroqqmlrunreqy.supabase.co/functions/v1/send-notification-email',
    body := jsonb_build_object('delivery_id', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-email-webhook-secret', 'esperanto-is-the-best-language-in-the-world'
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.push_notifications_enabled_for_type(profile_row public.profiles, notification_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  IF profile_row.push_notifications_enabled IS DISTINCT FROM TRUE THEN
    RETURN FALSE;
  END IF;

  RETURN CASE notification_type
    WHEN 'like' THEN profile_row.push_notify_like
    WHEN 'comment' THEN profile_row.push_notify_comment
    WHEN 'follow' THEN profile_row.push_notify_follow
    WHEN 'message' THEN profile_row.push_notify_message
    WHEN 'mention' THEN profile_row.push_notify_mention
    WHEN 'quote' THEN profile_row.push_notify_comment
    WHEN 'category_approved' THEN profile_row.push_notify_category_approved
    WHEN 'category_rejected' THEN profile_row.push_notify_category_rejected
    ELSE FALSE
  END;
END;
$function$
;

grant delete on table "public"."app_suggestions" to "anon";

grant insert on table "public"."app_suggestions" to "anon";

grant select on table "public"."app_suggestions" to "anon";

grant update on table "public"."app_suggestions" to "anon";

grant delete on table "public"."app_suggestions" to "authenticated";

grant insert on table "public"."app_suggestions" to "authenticated";

grant select on table "public"."app_suggestions" to "authenticated";

grant update on table "public"."app_suggestions" to "authenticated";

grant delete on table "public"."app_suggestions" to "service_role";

grant insert on table "public"."app_suggestions" to "service_role";

grant select on table "public"."app_suggestions" to "service_role";

grant update on table "public"."app_suggestions" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."category_suggestions" to "anon";

grant insert on table "public"."category_suggestions" to "anon";

grant select on table "public"."category_suggestions" to "anon";

grant update on table "public"."category_suggestions" to "anon";

grant delete on table "public"."category_suggestions" to "authenticated";

grant insert on table "public"."category_suggestions" to "authenticated";

grant select on table "public"."category_suggestions" to "authenticated";

grant update on table "public"."category_suggestions" to "authenticated";

grant delete on table "public"."category_suggestions" to "service_role";

grant insert on table "public"."category_suggestions" to "service_role";

grant select on table "public"."category_suggestions" to "service_role";

grant update on table "public"."category_suggestions" to "service_role";

grant delete on table "public"."comments" to "anon";

grant insert on table "public"."comments" to "anon";

grant select on table "public"."comments" to "anon";

grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";

grant insert on table "public"."comments" to "authenticated";

grant select on table "public"."comments" to "authenticated";

grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";

grant insert on table "public"."comments" to "service_role";

grant select on table "public"."comments" to "service_role";

grant update on table "public"."comments" to "service_role";

grant delete on table "public"."community_messages" to "anon";

grant insert on table "public"."community_messages" to "anon";

grant select on table "public"."community_messages" to "anon";

grant update on table "public"."community_messages" to "anon";

grant delete on table "public"."community_messages" to "authenticated";

grant insert on table "public"."community_messages" to "authenticated";

grant select on table "public"."community_messages" to "authenticated";

grant update on table "public"."community_messages" to "authenticated";

grant delete on table "public"."community_messages" to "service_role";

grant insert on table "public"."community_messages" to "service_role";

grant select on table "public"."community_messages" to "service_role";

grant update on table "public"."community_messages" to "service_role";

grant delete on table "public"."content_reports" to "anon";

grant insert on table "public"."content_reports" to "anon";

grant select on table "public"."content_reports" to "anon";

grant update on table "public"."content_reports" to "anon";

grant delete on table "public"."content_reports" to "authenticated";

grant insert on table "public"."content_reports" to "authenticated";

grant select on table "public"."content_reports" to "authenticated";

grant update on table "public"."content_reports" to "authenticated";

grant delete on table "public"."content_reports" to "service_role";

grant insert on table "public"."content_reports" to "service_role";

grant select on table "public"."content_reports" to "service_role";

grant update on table "public"."content_reports" to "service_role";

grant delete on table "public"."conversation_participants" to "anon";

grant insert on table "public"."conversation_participants" to "anon";

grant select on table "public"."conversation_participants" to "anon";

grant update on table "public"."conversation_participants" to "anon";

grant delete on table "public"."conversation_participants" to "authenticated";

grant insert on table "public"."conversation_participants" to "authenticated";

grant select on table "public"."conversation_participants" to "authenticated";

grant update on table "public"."conversation_participants" to "authenticated";

grant delete on table "public"."conversation_participants" to "service_role";

grant insert on table "public"."conversation_participants" to "service_role";

grant select on table "public"."conversation_participants" to "service_role";

grant update on table "public"."conversation_participants" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."follows" to "anon";

grant insert on table "public"."follows" to "anon";

grant select on table "public"."follows" to "anon";

grant update on table "public"."follows" to "anon";

grant delete on table "public"."follows" to "authenticated";

grant insert on table "public"."follows" to "authenticated";

grant select on table "public"."follows" to "authenticated";

grant update on table "public"."follows" to "authenticated";

grant delete on table "public"."follows" to "service_role";

grant insert on table "public"."follows" to "service_role";

grant select on table "public"."follows" to "service_role";

grant update on table "public"."follows" to "service_role";

grant delete on table "public"."likes" to "anon";

grant insert on table "public"."likes" to "anon";

grant select on table "public"."likes" to "anon";

grant update on table "public"."likes" to "anon";

grant delete on table "public"."likes" to "authenticated";

grant insert on table "public"."likes" to "authenticated";

grant select on table "public"."likes" to "authenticated";

grant update on table "public"."likes" to "authenticated";

grant delete on table "public"."likes" to "service_role";

grant insert on table "public"."likes" to "service_role";

grant select on table "public"."likes" to "service_role";

grant update on table "public"."likes" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."notification_devices" to "anon";

grant insert on table "public"."notification_devices" to "anon";

grant select on table "public"."notification_devices" to "anon";

grant update on table "public"."notification_devices" to "anon";

grant delete on table "public"."notification_devices" to "authenticated";

grant insert on table "public"."notification_devices" to "authenticated";

grant select on table "public"."notification_devices" to "authenticated";

grant update on table "public"."notification_devices" to "authenticated";

grant delete on table "public"."notification_devices" to "service_role";

grant insert on table "public"."notification_devices" to "service_role";

grant select on table "public"."notification_devices" to "service_role";

grant update on table "public"."notification_devices" to "service_role";

grant delete on table "public"."notification_email_deliveries" to "anon";

grant insert on table "public"."notification_email_deliveries" to "anon";

grant select on table "public"."notification_email_deliveries" to "anon";

grant update on table "public"."notification_email_deliveries" to "anon";

grant delete on table "public"."notification_email_deliveries" to "authenticated";

grant insert on table "public"."notification_email_deliveries" to "authenticated";

grant select on table "public"."notification_email_deliveries" to "authenticated";

grant update on table "public"."notification_email_deliveries" to "authenticated";

grant delete on table "public"."notification_email_deliveries" to "service_role";

grant insert on table "public"."notification_email_deliveries" to "service_role";

grant select on table "public"."notification_email_deliveries" to "service_role";

grant update on table "public"."notification_email_deliveries" to "service_role";

grant delete on table "public"."notification_push_deliveries" to "anon";

grant insert on table "public"."notification_push_deliveries" to "anon";

grant select on table "public"."notification_push_deliveries" to "anon";

grant update on table "public"."notification_push_deliveries" to "anon";

grant delete on table "public"."notification_push_deliveries" to "authenticated";

grant insert on table "public"."notification_push_deliveries" to "authenticated";

grant select on table "public"."notification_push_deliveries" to "authenticated";

grant update on table "public"."notification_push_deliveries" to "authenticated";

grant delete on table "public"."notification_push_deliveries" to "service_role";

grant insert on table "public"."notification_push_deliveries" to "service_role";

grant select on table "public"."notification_push_deliveries" to "service_role";

grant update on table "public"."notification_push_deliveries" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "participants_insert_own"
  on "public"."conversation_participants"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (public.is_conversation_participant(conversation_id) OR (NOT (EXISTS ( SELECT 1
   FROM public.conversation_participants cp
  WHERE (cp.conversation_id = conversation_participants.conversation_id)))))));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check (((auth.uid() = id) AND (role = ( SELECT p.role
   FROM public.profiles p
  WHERE (p.id = auth.uid())))));


CREATE TRIGGER on_comment_soft_delete AFTER UPDATE OF is_deleted ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_comment_soft_delete();

CREATE TRIGGER on_notification_email_delivery_webhook AFTER INSERT ON public.notification_email_deliveries FOR EACH ROW EXECUTE FUNCTION public.invoke_notification_email_delivery();

CREATE TRIGGER on_post_quote_notification AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_post_quote_notifications();

CREATE TRIGGER on_post_soft_delete AFTER UPDATE OF is_deleted ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_post_soft_delete();


