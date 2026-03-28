import { redirect, fail } from '@sveltejs/kit'
import { loginSchema } from '$lib/validators'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession()
  if (session) throw redirect(303, '/feed')
  return {}
}

export const actions: Actions = {
  login: async ({ request, locals }) => {
    const formData = await request.formData()
    const raw = { email: formData.get('email'), password: formData.get('password') }

    const result = loginSchema.safeParse(raw)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors })
    }

    const { error } = await locals.supabase.auth.signInWithPassword(result.data)
    if (error) return fail(400, { message: error.message })

    throw redirect(303, '/feed')
  },

  google: async ({ locals }) => {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:5173'}/auth/callback` }
    })
    if (error) return fail(400, { message: error.message })
    throw redirect(303, data.url)
  }
}
