import { redirect, fail } from '@sveltejs/kit'
import { registerSchema } from '$lib/validators'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession()
  if (session) throw redirect(303, '/feed')
  return {}
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const raw = {
      email: formData.get('email'),
      password: formData.get('password'),
      username: formData.get('username'),
      display_name: formData.get('display_name')
    }

    const result = registerSchema.safeParse(raw)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors, values: raw })
    }

    // Verificar username disponible
    const { data: existing } = await locals.supabase
      .from('profiles')
      .select('id')
      .eq('username', result.data.username)
      .single()

    if (existing) {
      return fail(400, {
        errors: { username: ['Tiu uzantnomo jam estas uzata'] },
        values: raw
      })
    }

    const { error } = await locals.supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          name: result.data.display_name,
          preferred_username: result.data.username
        }
      }
    })

    if (error) return fail(400, { message: error.message, values: raw })

    throw redirect(303, '/feed')
  }
}
