import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import PostComposer from '@/components/PostComposer'
import { renderWithQuery } from '@/test/renderWithQuery'
import { useAuthStore } from '@/stores/auth'
import type { Category, Post, Profile } from '@/lib/types'

const {
  insert,
  upload,
  getPublicUrl,
  select,
  ilike,
  neq,
  limit,
  info,
  success,
  error,
  invalidateQueries,
} = vi.hoisted(() => {
  const insert = vi.fn()
  const upload = vi.fn()
  const getPublicUrl = vi.fn()
  const limit = vi.fn()
  const neq = vi.fn(() => ({ limit }))
  const ilike = vi.fn(() => ({ neq }))
  const select = vi.fn(() => ({ ilike }))
  const info = vi.fn()
  const success = vi.fn()
  const error = vi.fn()
  const invalidateQueries = vi.fn()

  return {
    insert,
    upload,
    getPublicUrl,
    select,
    ilike,
    neq,
    limit,
    info,
    success,
    error,
    invalidateQueries,
  }
})

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'posts') {
        return { insert }
      }

      if (table === 'profiles') {
        return { select }
      }

      return {}
    }),
    storage: {
      from: vi.fn(() => ({
        upload,
        getPublicUrl,
      })),
    },
  },
}))

vi.mock('@/stores/toasts', () => ({
  useToastStore: () => ({
    info,
    success,
    error,
  }),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries,
    }),
  }
})

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Generala',
    slug: 'general',
    description: '',
    icon: 'hash',
    color: '#16a34a',
    post_count: 0,
    sort_order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    username: 'ada',
    display_name: 'Ada Lovelace',
    bio: '',
    avatar_url: '',
    esperanto_level: 'flua',
    theme: 'green',
    role: 'user',
    website: '',
    country: null,
    region: null,
    city: null,
    location_lat: null,
    location_lng: null,
    map_visible: false,
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    email_notifications_enabled: true,
    email_notify_like: true,
    email_notify_comment: true,
    email_notify_follow: true,
    email_notify_message: true,
    email_notify_mention: true,
    email_notify_category_approved: true,
    email_notify_category_rejected: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeQuotedPost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-quoted',
    user_id: 'user-quoted',
    category_id: 'cat-1',
    content: 'Citata enhavo',
    image_urls: [],
    likes_count: 0,
    comments_count: 0,
    is_edited: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    author: makeProfile({
      id: 'user-quoted',
      username: 'quoted-user',
      display_name: 'Quoted User',
    }),
    ...overrides,
  }
}

describe('PostComposer', () => {
  const categories = [
    makeCategory({ id: 'cat-1', slug: 'general', name: 'Generala' }),
    makeCategory({ id: 'cat-2', slug: 'news', name: 'Novajoj' }),
  ]

  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      initialized: false,
      profileLoaded: false,
    })

    insert.mockReset()
    upload.mockReset()
    getPublicUrl.mockReset()
    select.mockReset()
    ilike.mockReset()
    neq.mockReset()
    limit.mockReset()
    info.mockReset()
    success.mockReset()
    error.mockReset()
    invalidateQueries.mockReset()

    select.mockReturnValue({ ilike })
    ilike.mockReturnValue({ neq })
    neq.mockReturnValue({ limit })
    limit.mockReturnValue({})
    getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.test/image.jpg' } })
  })

  it('shows quote mode and allows clearing the quoted post', () => {
    const onQuoteClear = vi.fn()

    renderWithQuery(
      <PostComposer
        categories={categories}
        quotedPost={makeQuotedPost()}
        onQuoteClear={onQuoteClear}
      />
    )

    expect(screen.getByText('Citante')).toBeInTheDocument()
    expect(screen.getByText('Citata enhavo')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Forigu cita/i }))

    expect(onQuoteClear).toHaveBeenCalledTimes(1)
  })

  it('falls back to the first category for guests and keeps actions disabled', () => {
    useAuthStore.setState({
      initialized: true,
      profileLoaded: true,
    })

    renderWithQuery(<PostComposer categories={categories} />)

    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Saluton' } })

    expect(screen.getByRole('combobox', { name: 'Kategorio' })).toHaveValue('cat-1')
    expect(screen.getByRole('button', { name: 'Bildoj' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Afiŝi' })).toBeDisabled()
  })

  it('uses the provided default category for authenticated users', () => {
    useAuthStore.setState({
      user: { id: 'user-1' } as never,
      profile: makeProfile(),
      initialized: true,
      profileLoaded: true,
    })

    renderWithQuery(
      <PostComposer
        categories={categories}
        defaultCategoryId="cat-2"
      />
    )

    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nova enhavo' } })

    expect(screen.getByRole('combobox', { name: 'Kategorio' })).toHaveValue('cat-2')
    expect(screen.getByRole('button', { name: 'Bildoj' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Afiŝi' })).toBeEnabled()
  })

  it('submits quoted posts and retries without optional fields when Supabase lacks support', async () => {
    useAuthStore.setState({
      user: { id: 'user-1' } as never,
      profile: makeProfile(),
      initialized: true,
      profileLoaded: true,
    })

    insert
      .mockResolvedValueOnce({ error: { message: 'column posts.quoted_post_id does not exist' } })
      .mockResolvedValueOnce({ error: null })

    renderWithQuery(
      <PostComposer
        categories={categories}
        defaultCategoryId="cat-2"
        quotedPost={makeQuotedPost()}
      />
    )

    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mi komentas la citajon' } })
    fireEvent.click(screen.getByRole('button', { name: 'Afiŝi' }))

    await waitFor(() => {
      expect(insert).toHaveBeenCalledTimes(2)
    })

    expect(insert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        user_id: 'user-1',
        category_id: 'cat-2',
        content: 'Mi komentas la citajon',
        quoted_post_id: 'post-quoted',
        link_preview: null,
      }),
    )

    expect(insert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user_id: 'user-1',
        category_id: 'cat-2',
        content: 'Mi komentas la citajon',
        image_urls: [],
      }),
    )

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('')
      expect(success).toHaveBeenCalled()
    })
  })
})
