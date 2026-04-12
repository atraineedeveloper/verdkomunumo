import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { queryKeys } from '@/lib/query/keys'
import { formatDate, getAvatarUrl } from '@/lib/utils'
import type { Conversation, Message, Profile } from '@/lib/types'
import { routes } from '@/lib/routes'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { PresenceAvatar } from '@/components/ui/PresenceAvatar'

async function fetchConversations(userId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('type', 'message').eq('is_read', false)

  const { data: memberships } = await supabase.from('conversation_participants').select('conversation_id, last_read_at').eq('user_id', userId)
  if (!memberships?.length) return [] as Conversation[]

  const conversationIds = memberships.map((membership) => membership.conversation_id)
  const [conversationsRes, participantRowsRes, messageRowsRes] = await Promise.all([
    supabase.from('conversations').select('*').in('id', conversationIds).order('updated_at', { ascending: false }),
    supabase.from('conversation_participants').select('conversation_id, profile:profiles(*)').in('conversation_id', conversationIds),
    supabase.from('messages').select('id, conversation_id, sender_id, content, is_read, created_at').in('conversation_id', conversationIds).order('created_at', { ascending: false }),
  ])

  const participantsByConversation = new Map<string, Profile[]>()
  for (const row of participantRowsRes.data ?? []) {
    const participants = participantsByConversation.get(row.conversation_id) ?? []
    if (row.profile) participants.push(row.profile as unknown as Profile)
    participantsByConversation.set(row.conversation_id, participants)
  }

  const latestMessageByConversation = new Map<string, Message>()
  const unreadCountByConversation = new Map<string, number>()
  const lastReadAtByConversation = new Map(memberships.map((membership) => [membership.conversation_id, membership.last_read_at ?? new Date(0).toISOString()]))

  for (const message of messageRowsRes.data ?? []) {
    if (!latestMessageByConversation.has(message.conversation_id)) latestMessageByConversation.set(message.conversation_id, message)
    const lastReadAt = lastReadAtByConversation.get(message.conversation_id) ?? new Date(0).toISOString()
    if (message.sender_id !== userId && message.created_at > lastReadAt) {
      unreadCountByConversation.set(message.conversation_id, (unreadCountByConversation.get(message.conversation_id) ?? 0) + 1)
    }
  }

  return ((conversationsRes.data ?? []).map((conversation) => ({
    ...conversation,
    participants: participantsByConversation.get(conversation.id) ?? [],
    last_message: latestMessageByConversation.get(conversation.id) ?? null,
    unread_count: unreadCountByConversation.get(conversation.id) ?? 0,
  })) as Conversation[])
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const toast = useToastStore()
  const [searchParams] = useSearchParams()
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [startingConversation, setStartingConversation] = useState<string | null>(null)

  const { data: conversations = [], isLoading, isFetching } = useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: () => fetchConversations(user!.id),
    enabled: Boolean(user),
  })

  useEffect(() => {
    const newUser = searchParams.get('new')
    if (newUser) {
      setSearch(newUser)
      setShowNew(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
          .neq('id', user?.id ?? '')
          .limit(10)
        setResults((data ?? []) as Profile[])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, user])

  const startMutation = useMutation({
    mutationFn: async (targetId: string) => {
      if (!user) throw new Error('Ne ensalutinta')
      const { data: existing } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', user.id)

      if (existing && existing.length > 0) {
        const myConvIds = existing.map((row) => row.conversation_id)
        const { data: shared } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', targetId)
          .in('conversation_id', myConvIds)
          .limit(1)
          .maybeSingle()
        if (shared) return shared.conversation_id
      }

      const conversationId = crypto.randomUUID()
      const { error: conversationError } = await supabase.from('conversations').insert({ id: conversationId })
      if (conversationError) throw conversationError
      const { error: selfError } = await supabase.from('conversation_participants').insert({ conversation_id: conversationId, user_id: user.id })
      if (selfError) throw selfError
      const { error: targetError } = await supabase.from('conversation_participants').insert({ conversation_id: conversationId, user_id: targetId })
      if (targetError) throw targetError
      return conversationId
    },
    onSuccess: async (conversationId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations() })
      navigate(routes.conversation(conversationId))
    },
    onError: () => toast.error(t('messages_start_error')),
  })

  function getOther(conv: Conversation) {
    return conv.participants?.find((participant) => participant.id !== user?.id) ?? conv.participants?.[0]
  }

  return (
    <>
      <Helmet><title>{t('nav_messages')} — Verdkomunumo</title></Helmet>

      <div className="header">
        <h1>{t('nav_messages')}</h1>
        <div className="header-actions">
          {isFetching && !isLoading && <InlineSpinner size={13} className="text-[var(--color-primary)]" />}
          <Link className="btn-chat" to={routes.communityChat}>
            {t('nav_chat', { defaultValue: 'Babilejo' })}
          </Link>
          <button className="btn-new" type="button" onClick={() => { setShowNew(true); setSearch(''); setResults([]) }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t('messages_new')}
        </button>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton items={5} avatarSize={44} />
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <p className="empty">{t('messages_empty')}</p>
          <button className="btn-new-lg" type="button" onClick={() => { setShowNew(true); setSearch(''); setResults([]) }}>
            {t('messages_start')}
          </button>
        </div>
      ) : (
        <div className="list">
          {conversations.map((conv) => {
            const other = getOther(conv)
            return (
              <Link key={conv.id} to={routes.conversation(conv.id)} className={`row${(conv.unread_count ?? 0) > 0 ? ' unread' : ''}`}>
                {other && (
                  <PresenceAvatar
                    userId={other.id}
                    avatarUrl={other.avatar_url}
                    displayName={other.display_name}
                    wrapperClassName="ava-wrap"
                    imageClassName="ava"
                    dotClassName="ava-dot"
                  />
                )}
                <div className="body">
                  <div className="top">
                    <span className="name">{other?.display_name ?? '?'}</span>
                    {conv.last_message && <span className="time">{formatDate(conv.last_message.created_at)}</span>}
                  </div>
                  {conv.last_message ? (
                    <p className="preview">{conv.last_message.content}</p>
                  ) : (
                    <p className="preview muted">{t('messages_thread_empty')}</p>
                  )}
                </div>
                {(conv.unread_count ?? 0) > 0 && <span className="badge">{conv.unread_count}</span>}
              </Link>
            )
          })}
        </div>
      )}

      {showNew && (
        <>
          <button className="veil" onClick={() => setShowNew(false)} tabIndex={-1} aria-hidden="true" />
          <div className="modal" role="dialog" aria-label="Nueva mesaĝo">
            <div className="modal-head">
              <span className="modal-title">{t('messages_new')}</span>
              <button className="modal-close" type="button" onClick={() => setShowNew(false)}>×</button>
            </div>
            <div className="modal-search">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('messages_search_placeholder')} />
            </div>
            <div className="modal-results">
              {searching ? (
                <p className="hint">{t('messages_searching')}</p>
              ) : search.trim().length >= 2 && results.length === 0 ? (
                <p className="hint">{t('messages_no_results')}</p>
              ) : search.trim().length < 2 ? (
                <p className="hint">{t('messages_search_hint')}</p>
              ) : (
                results.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className="result-row"
                    disabled={startingConversation === profile.id}
                    onClick={() => {
                      setStartingConversation(profile.id)
                      startMutation.mutate(profile.id, { onSettled: () => setStartingConversation(null) })
                    }}
                  >
                    <PresenceAvatar
                      userId={profile.id}
                      avatarUrl={profile.avatar_url}
                      displayName={profile.display_name}
                      wrapperClassName="result-ava-wrap"
                      imageClassName="result-ava"
                      dotClassName="result-dot"
                    />
                    <div>
                      <span className="result-name">{profile.display_name}</span>
                      <span className="result-user">@{profile.username}</span>
                    </div>
                    <span className="result-cta">
                      {startingConversation === profile.id ? <InlineSpinner size={12} /> : t('messages_start')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); margin-bottom: 0.25rem; }
        .header-actions { display: flex; align-items: center; gap: 0.6rem; }
        h1 { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; color: var(--color-text); margin: 0; }
        .btn-new, .btn-chat { display: inline-flex; align-items: center; gap: 0.35rem; border-radius: 6px; padding: 0.38rem 0.75rem; font-size: 0.8rem; font-weight: 600; transition: opacity 0.12s; }
        .btn-new { background: var(--color-primary); color: #fff; border: none; cursor: pointer; font-family: inherit; }
        .btn-chat { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); text-decoration: none; }
        .btn-new:hover,.btn-new-lg:hover { opacity: 0.85; }
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem 0; }
        .empty { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
        .btn-new-lg { background: var(--color-primary); color: #fff; border: none; border-radius: 8px; padding: 0.55rem 1.25rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.12s; }
        .list { display: flex; flex-direction: column; }
        .row { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 0; border-bottom: 1px solid var(--color-border); text-decoration: none; transition: background 0.12s; border-radius: 6px; }
        .row:hover { background: var(--color-surface-alt); padding-left: 0.5rem; padding-right: 0.5rem; margin: 0 -0.5rem; }
        .row.unread .name { font-weight: 700; }
        .row.unread .preview { color: var(--color-text); }
        .ava-wrap { width: 44px; height: 44px; }
        .ava { width: 44px; height: 44px; }
        .ava-dot { width: 11px; height: 11px; right: 1px; bottom: 1px; }
        .body { flex: 1; min-width: 0; }
        .top { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.15rem; }
        .name { font-size: 0.875rem; color: var(--color-text); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .time { font-size: 0.72rem; color: var(--color-text-muted); flex-shrink: 0; }
        .preview { margin: 0; font-size: 0.82rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .badge { min-width: 1.15rem; height: 1.15rem; padding: 0 0.3rem; border-radius: 999px; background: var(--color-primary); color: white; font-size: 0.68rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .veil { position: fixed; inset: 0; z-index: 120; background: rgba(10, 16, 12, 0.22); border: 0; padding: 0; }
        .modal { position: fixed; inset: auto 1rem 1rem; max-width: 430px; width: calc(100vw - 2rem); margin-left: auto; margin-right: auto; left: 0; right: 0; z-index: 130; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.18); overflow: hidden; }
        .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1rem; border-bottom: 1px solid var(--color-border); }
        .modal-title { font-size: 0.9rem; font-weight: 700; color: var(--color-text); }
        .modal-close { border: 0; background: transparent; font-size: 1.25rem; line-height: 1; color: var(--color-text-muted); cursor: pointer; }
        .modal-search { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; border-bottom: 1px solid var(--color-border); color: var(--color-text-muted); }
        .modal-search input { flex: 1; border: 0; background: transparent; color: var(--color-text); font: inherit; outline: none; }
        .modal-results { max-height: 320px; overflow-y: auto; padding: 0.4rem; }
        .hint { margin: 0; padding: 1rem 0.75rem; text-align: center; color: var(--color-text-muted); font-size: 0.825rem; }
        .result-row { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem; border: 0; border-radius: 10px; background: transparent; text-align: left; cursor: pointer; color: inherit; }
        .result-row:hover { background: var(--color-surface-alt); }
        .result-row:disabled { opacity: 0.7; cursor: wait; }
        .result-ava-wrap { width: 40px; height: 40px; }
        .result-ava { width: 40px; height: 40px; }
        .result-dot { width: 10px; height: 10px; right: -1px; bottom: -1px; }
        .result-name,.result-user { display: block; }
        .result-name { font-size: 0.86rem; font-weight: 600; color: var(--color-text); }
        .result-user { font-size: 0.78rem; color: var(--color-text-muted); }
        .result-cta { margin-left: auto; font-size: 0.78rem; color: var(--color-primary); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; min-width: 3.75rem; }
      `}</style>
    </>
  )
}
