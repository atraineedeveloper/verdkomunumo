import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { json } from '@sveltejs/kit'
import { requireUser } from '$lib/server/social'
import { appSuggestionSchema } from '$lib/validators'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export async function POST({ request, locals }) {
  if (DEMO) {
    return json({ message: 'Demo mode is enabled' }, { status: 400 })
  }

  const user = await requireUser(locals)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return json({ message: 'Malformed request body' }, { status: 400 })
  }

  const raw = payload as Record<string, unknown>
  const parsed = appSuggestionSchema.safeParse({
    title: typeof raw.title === 'string' ? raw.title.trim() : raw.title,
    description: typeof raw.description === 'string' ? raw.description.trim() : raw.description,
    context: typeof raw.context === 'string' ? raw.context.trim() : raw.context
  })

  if (!parsed.success) {
    return json(
      {
        message: 'Please review the suggestion details.',
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    )
  }

  const { error } = await locals.supabase.from('app_suggestions').insert({
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    context: parsed.data.context ?? ''
  })

  if (error) {
    return json({ message: error.message }, { status: 500 })
  }

  return json({ success: true, message: 'Suggestion sent.' })
}
