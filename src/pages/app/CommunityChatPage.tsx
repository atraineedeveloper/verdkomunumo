import { useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { PresenceAvatar } from '@/components/ui/PresenceAvatar'
import { COMMUNITY_MESSAGES_LIMIT, mergeCommunityMessages, normalizeCommunityMessages } from '@/lib/communityChat'
import { queryKeys } from '@/lib/query/keys'
import { routes } from '@/lib/routes'
import { supabase } from '@/lib/supabase/client'
import type { CommunityMessage } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { usePresenceStore } from '@/stores/presence'
import { useToastStore } from '@/stores/toasts'
import { Link } from 'react-router-dom'

async function fetchCommunityMessages() {
  const { data, error } = await supabase
    .from('community_messages')
    .select('*, author:profiles!user_id(*)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(COMMUNITY_MESSAGES_LIMIT)

  if (error) throw error

  return normalizeCommunityMessages((data ?? []) as CommunityMessage[])
}

export default function CommunityChatPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToastStore()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const activeUsersMap = usePresenceStore((state) => state.activeUsers)
  const [composing, setComposing] = useState('')
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const { data: messages = [], isLoading, isFetching } = useQuery({
    queryKey: queryKeys.communityMessages(),
    queryFn: fetchCommunityMessages,
    enabled: Boolean(user),
  })

  const activeUsers = useMemo(
    () =>
      Object.values(activeUsersMap).sort((left, right) =>
        left.display_name.localeCompare(right.display_name, undefined, { sensitivity: 'base' }),
      ),
    [activeUsersMap],
  )

  useEffect(() => {
    if (!messagesRef.current) return
    messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = '0px'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
  }, [composing])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('community-messages-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, async (payload) => {
        const insertedId = String(payload.new.id ?? '')
        if (!insertedId) return

        const { data } = await supabase
          .from('community_messages')
          .select('*, author:profiles!user_id(*)')
          .eq('id', insertedId)
          .maybeSingle()

        if (!data) return

        queryClient.setQueryData(queryKeys.communityMessages(), (current: CommunityMessage[] | undefined) =>
          mergeCommunityMessages(current ?? [], data as CommunityMessage),
        )
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  const sendMutation = useMutation({
    mutationFn: async ({ content, clientNonce }: { content: string; clientNonce: string }) => {
      if (!user || !profile) throw new Error(t('community_chat_send_error', { defaultValue: 'Mesaĝo ne povis esti sendita.' }))
      if (!content) throw new Error(t('community_chat_send_error', { defaultValue: 'Mesaĝo ne povis esti sendita.' }))

      const { error } = await supabase.from('community_messages').insert({
        user_id: user.id,
        content,
        client_nonce: clientNonce,
      })

      if (error) throw error

      return { content, clientNonce }
    },
    onMutate: async (variables) => {
      if (!user || !profile) return

      await queryClient.cancelQueries({ queryKey: queryKeys.communityMessages() })
      const previousMessages = queryClient.getQueryData(queryKeys.communityMessages())
      const optimisticMessage: CommunityMessage = {
        id: `optimistic-${variables.clientNonce}`,
        user_id: user.id,
        content: variables.content,
        client_nonce: variables.clientNonce,
        created_at: new Date().toISOString(),
        author: profile,
      }

      queryClient.setQueryData(queryKeys.communityMessages(), (current: CommunityMessage[] | undefined) =>
        mergeCommunityMessages(current ?? [], optimisticMessage),
      )

      setComposing('')
      return { previousMessages, optimisticMessage }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.communityMessages(), context.previousMessages)
      }
      toast.error(t('community_chat_send_error', { defaultValue: 'Mesaĝo ne povis esti sendita.' }))
    },
    onSuccess: async (_result, _variables, context) => {
      if (context?.optimisticMessage?.client_nonce) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.communityMessages() })
      }
    },
  })

  const handleSendMessage = () => {
    const trimmed = composing.trim()
    if (!trimmed || sendMutation.isPending) return
    sendMutation.mutate({ content: trimmed, clientNonce: crypto.randomUUID() })
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    handleSendMessage()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) return <ListSkeleton items={6} avatarSize={28} />

  return (
    <>
      <Helmet><title>{t('community_chat_title', { defaultValue: 'Komunuma babilejo' })} — Verdkomunumo</title></Helmet>

      <div className="community-layout">
        <section className="community-main">
          <div className="community-header">
            <div>
              <h1>{t('community_chat_title', { defaultValue: 'Komunuma babilejo' })}</h1>
              <p>{t('community_chat_subtitle', { defaultValue: 'Babilu kun la tuta komunumo en reala tempo.' })}</p>
            </div>
            <div className="community-header-actions">
              {isFetching && <InlineSpinner size={13} className="text-[var(--color-primary)]" />}
              <Link to={routes.messages} className="community-link">
                {t('nav_messages')}
              </Link>
            </div>
          </div>

          <div className="community-messages" ref={messagesRef}>
            {messages.length === 0 ? (
              <div className="empty-thread">
                <p className="empty-title">{t('community_chat_empty', { defaultValue: 'Ankoraŭ neniu mesaĝo en la komunuma kanalo.' })}</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.user_id === user?.id
                return (
                  <div key={message.id} className={`community-row${isMe ? ' me' : ''}`}>
                    {!isMe && message.author ? (
                      <PresenceAvatar
                        userId={message.author.id}
                        avatarUrl={message.author.avatar_url}
                        displayName={message.author.display_name}
                        wrapperClassName="message-avatar-wrap"
                        imageClassName="message-avatar"
                        dotClassName="message-dot"
                      />
                    ) : null}
                    <div className={`community-bubble ${isMe ? 'community-bubble-me' : 'community-bubble-them'}`}>
                      {!isMe && message.author ? (
                        <div className="community-author-line">
                          <Link to={routes.profile(message.author.username)} className="community-author">
                            {message.author.display_name}
                          </Link>
                          <span className="community-handle">@{message.author.username}</span>
                        </div>
                      ) : null}
                      <p>{message.content}</p>
                      <span className="community-ts">{formatDate(message.created_at)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form
            className="community-compose"
            onSubmit={handleSubmit}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={composing}
              onChange={(event) => setComposing(event.target.value)}
              placeholder={t('community_chat_placeholder', { defaultValue: 'Skribu mesaĝon al la komunumo…' })}
              onKeyDown={handleKeyDown}
            />
            <button type="submit" disabled={sendMutation.isPending || composing.trim().length === 0}>
              {sendMutation.isPending ? <InlineSpinner size={13} className="mr-1.5" /> : null}
              {sendMutation.isPending
                ? t('community_chat_sending', { defaultValue: 'Sendante…' })
                : t('community_chat_send', { defaultValue: 'Sendi' })}
            </button>
          </form>
        </section>

        <aside className="community-sidebar">
          <div className="community-sidebar-card">
            <div className="community-sidebar-head">
              <h2>{t('community_chat_active_now', { defaultValue: 'Aktivaj nun' })}</h2>
              <span>{activeUsers.length}</span>
            </div>
            {activeUsers.length === 0 ? (
              <p className="community-empty-active">{t('community_chat_empty_active', { defaultValue: 'Neniu aktiva nun.' })}</p>
            ) : (
              <div className="community-active-list">
                {activeUsers.map((activeUser) => (
                  <Link key={activeUser.user_id} to={routes.profile(activeUser.username)} className="community-active-row">
                    <PresenceAvatar
                      userId={activeUser.user_id}
                      avatarUrl={activeUser.avatar_url}
                      displayName={activeUser.display_name}
                      wrapperClassName="active-avatar-wrap"
                      imageClassName="active-avatar"
                    />
                    <div className="community-active-info">
                      <span className="community-active-name">{activeUser.display_name}</span>
                      <span className="community-active-user">@{activeUser.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <style>{`
        .community-layout { display: grid; gap: 1rem; align-items: start; }
        @media (min-width: 960px) { .community-layout { grid-template-columns: minmax(0, 1fr) 280px; } }
        .community-main, .community-sidebar-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 18px; }
        .community-main { padding: 1rem; }
        .community-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding-bottom: 0.9rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem; }
        .community-header h1 { margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--color-text); }
        .community-header p { margin: 0.25rem 0 0; font-size: 0.84rem; color: var(--color-text-muted); }
        .community-header-actions { display: inline-flex; align-items: center; gap: 0.65rem; }
        .community-link { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 0.75rem; border-radius: 999px; border: 1px solid var(--color-border); text-decoration: none; color: var(--color-text); font-size: 0.8rem; font-weight: 600; }
        .community-messages { display: flex; flex-direction: column; gap: 0.6rem; min-height: 360px; max-height: 62vh; overflow-y: auto; padding-right: 0.25rem; margin-bottom: 1rem; }
        .community-row { display: flex; align-items: flex-end; gap: 0.5rem; }
        .community-row.me { flex-direction: row-reverse; }
        .message-avatar-wrap { width: 30px; height: 30px; }
        .message-avatar { width: 30px; height: 30px; }
        .message-dot { width: 10px; height: 10px; right: -1px; bottom: -1px; }
        .community-bubble { max-width: min(78%, 580px); padding: 0.7rem 0.85rem; border-radius: 16px; }
        .community-bubble p { margin: 0 0 0.24rem; font-size: 0.9rem; line-height: 1.55; color: inherit; white-space: pre-wrap; word-break: break-word; }
        .community-bubble-me { background: var(--color-primary); color: white; border-bottom-right-radius: 5px; }
        .community-bubble-them { background: var(--color-surface-alt); color: var(--color-text); border-bottom-left-radius: 5px; }
        .community-author-line { display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.3rem; }
        .community-author { font-size: 0.78rem; font-weight: 700; color: inherit; text-decoration: none; }
        .community-author:hover { text-decoration: underline; }
        .community-handle, .community-ts { font-size: 0.68rem; color: var(--color-text-muted); }
        .community-bubble-me .community-ts { color: rgba(255,255,255,0.76); }
        .community-ts { display: block; text-align: right; }
        .empty-thread { margin: auto 0; padding: 2.5rem 1rem; text-align: center; }
        .empty-title { margin: 0; color: var(--color-text-muted); font-size: 0.9rem; }
        .community-compose { display: flex; align-items: flex-end; gap: 0.7rem; padding-top: 0.9rem; border-top: 1px solid var(--color-border); }
        .community-compose textarea { flex: 1; min-height: 44px; max-height: 140px; resize: none; border-radius: 14px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); padding: 0.75rem 0.9rem; font: inherit; line-height: 1.5; outline: none; }
        .community-compose textarea:focus { border-color: var(--color-primary); }
        .community-compose button { border: 0; background: var(--color-primary); color: white; font: inherit; font-size: 0.84rem; font-weight: 700; border-radius: 999px; padding: 0.74rem 1rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .community-compose button:disabled { opacity: 0.55; cursor: not-allowed; }
        .community-sidebar-card { padding: 1rem; position: sticky; top: 76px; }
        .community-sidebar-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.9rem; }
        .community-sidebar-head h2 { margin: 0; font-size: 0.88rem; color: var(--color-text); }
        .community-sidebar-head span { display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.5rem; padding: 0 0.4rem; border-radius: 999px; background: var(--color-primary-dim); color: var(--color-primary); font-size: 0.75rem; font-weight: 700; }
        .community-empty-active { margin: 0; color: var(--color-text-muted); font-size: 0.82rem; }
        .community-active-list { display: flex; flex-direction: column; gap: 0.35rem; }
        .community-active-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem; border-radius: 12px; text-decoration: none; color: inherit; }
        .community-active-row:hover { background: var(--color-surface-alt); }
        .active-avatar-wrap { width: 40px; height: 40px; }
        .active-avatar { width: 40px; height: 40px; }
        .community-active-info { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
        .community-active-name { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
        .community-active-user { font-size: 0.76rem; color: var(--color-text-muted); }
      `}</style>
    </>
  )
}
