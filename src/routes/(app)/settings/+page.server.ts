import { fail, redirect } from '@sveltejs/kit'
import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockProfile } from '$lib/mock'
import { uploadAvatar } from '$lib/server/storage'
import { profileEditSchema } from '$lib/validators'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) return { profile: mockProfile }

  const { user } = await locals.safeGetSession()
  if (!user) throw redirect(303, '/login')

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { profile }
}

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession()
    if (!user) return fail(401)

    const formData = await request.formData()
    const raw = {
      display_name: formData.get('display_name'),
      bio: formData.get('bio'),
      website: formData.get('website'),
      location: formData.get('location'),
      esperanto_level: formData.get('esperanto_level')
    }

    const result = profileEditSchema.safeParse(raw)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors })
    }

    const avatar = formData.get('avatar')
    let avatarUrl: string | undefined
    if (avatar instanceof File && avatar.size > 0) {
      avatarUrl = await uploadAvatar(locals, user.id, avatar)
    }

    const { error } = await locals.supabase
      .from('profiles')
      .update({
        ...result.data,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) return fail(500, { message: error.message })

    return { success: true }
  },

  updateTheme: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession()
    if (!user) return fail(401)

    const formData = await request.formData()
    const theme = formData.get('theme') as string

    if (!['green', 'dark', 'vivid', 'minimal'].includes(theme)) {
      return fail(400, { message: 'Nevalida temo' })
    }

    await locals.supabase.from('profiles').update({ theme }).eq('id', user.id)

    return { success: true }
  }
}
