import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
      }
    }
  })

  event.locals.safeGetSession = async () => {
    const clearSupabaseCookies = () => {
      for (const { name } of event.cookies.getAll()) {
        if (name.startsWith('sb-')) {
          event.cookies.delete(name, { path: '/' })
        }
      }
    }

    try {
      const {
        data: { user },
        error
      } = await event.locals.supabase.auth.getUser()

      if (error || !user) {
        if (error?.code === 'refresh_token_not_found') {
          clearSupabaseCookies()
        }

        return { session: null, user: null }
      }

      return { session: null, user }
    } catch (error) {
      clearSupabaseCookies()
      return { session: null, user: null }
    }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    }
  })
}
