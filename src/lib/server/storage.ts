import { error } from '@sveltejs/kit'
import { POST_MAX_IMAGES } from '$lib/constants'

const IMAGE_MIME_PREFIX = 'image/'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const MAX_POST_IMAGE_BYTES = 8 * 1024 * 1024

function sanitizeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '')
}

function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 5) return fromName

  const fromType = file.type.split('/')[1]?.toLowerCase()
  if (fromType) return fromType === 'jpeg' ? 'jpg' : fromType

  return 'bin'
}

function assertImageFile(file: File, maxBytes: number) {
  if (!file.type.startsWith(IMAGE_MIME_PREFIX)) {
    throw error(400, 'La dosiero devas esti bildo')
  }

  if (file.size > maxBytes) {
    throw error(400, 'La dosiero estas tro granda')
  }
}

export async function uploadAvatar(locals: App.Locals, userId: string, file: File) {
  assertImageFile(file, MAX_AVATAR_BYTES)

  const ext = getFileExtension(file)
  const path = `${sanitizeFilenamePart(userId)}/avatar-${Date.now()}.${ext}`

  const { error: uploadError } = await locals.supabase.storage
    .from('avatars')
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    throw error(500, uploadError.message)
  }

  const { data } = locals.supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadPostImages(locals: App.Locals, userId: string, files: File[]) {
  const imageFiles = files.filter((file) => file.size > 0)

  if (imageFiles.length > POST_MAX_IMAGES) {
    throw error(400, `Vi povas alŝuti maksimume ${POST_MAX_IMAGES} bildojn`)
  }

  return Promise.all(
    imageFiles.map(async (file, index) => {
      assertImageFile(file, MAX_POST_IMAGE_BYTES)

      const ext = getFileExtension(file)
      const path = `${sanitizeFilenamePart(userId)}/${Date.now()}-${index}.${ext}`

      const { error: uploadError } = await locals.supabase.storage
        .from('post-images')
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        throw error(500, uploadError.message)
      }

      const { data } = locals.supabase.storage.from('post-images').getPublicUrl(path)
      return data.publicUrl
    })
  )
}
