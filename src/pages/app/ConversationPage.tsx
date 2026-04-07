import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

async function fetchConversationPage(conversationId: string, userId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('type', 'message').eq('is_read', false)

  const { data: membership } = await supabase.from('conversation_participants').select('id').eq('conversation_id', conversationId).eq('user_id', userId).maybeSingle()
  if (!membership) throw new Error('Vi ne apartenas al ĉi tiu konversacio')

  const [conversationRes, participantRowsRes, messagesRes] = await Promise.all([
    supabase.from('conversations').select('*').eq('id', conversationId).single(),
    supabase.from('conversation_participants').select('conversation_id, profile:profiles(*)').eq('conversation_id', conversationId),
    supabase.from('messages').select('*, sender:profiles!sender_id(*)').eq('conversation_id', conversationId).order('created_at'),
  ])

  const participants = (participantRowsRes.data ?? [])
    .map((row) => row.profile as unknown as Profile | null)
    .filter(Boolean) as Profile[]

  await Promise.all([
    supabase.from('messages').update({ is_read: true }).eq('conversation_id', conversationId).neq('sender_id', userId),
    supabase.from('conversation_participants').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', userId),
  ])

  return {
    conversation: { ...(conversationRes.data as Conversation), participants },
    messages: (messagesRes.data ?? []) as Message[],
  }
}

export default function ConversationPage() {
  const { conversationId = '' } = useParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const toast = useToastStore()
  const msgsEl = useRef<HTMLDivElement | null>(null)
  const textAreaEl = useRef<HTMLTextAreaElement | null>(null)
  const [composing, setComposing] = useState('')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: () => fetchConversationPage(conversationId, user!.id),
    enabled: Boolean(user && conversationId),
  })

  const conversation = data?.conversation
  const messages = data?.messages ?? []
  const other = conversation?.participants?.find((participant) => participant.id !== user?.id) ?? conversation?.participants?.[0]

  useEffect(() => {
    if (!msgsEl.current) return
    msgsEl.current.scrollTo({ top: msgsEl.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (!textAreaEl.current) return
    textAreaEl.current.style.height = '0px'
    textAreaEl.current.style.height = `${Math.min(textAreaEl.current.scrollHeight, 140)}px`
  }, [composing])

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!user || !conversationId) throw new Error(t('messages_send_error'))
      const content = composing.trim()
      if (!content) throw new Error(t('messages_send_error'))
      const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, content })
      if (error) throw error
      await supabase.from('conversation_participants').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', user.id)
      return content
    },
    onMutate: async () => {
      if (!user) return
      const content = composing.trim()
      const messageKey = queryKeys.messages(conversationId)
      await queryClient.cancelQueries({ queryKey: messageKey })
      const previousThread = queryClient.getQueryData(messageKey)
      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        is_read: true,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          username: useAuthStore.getState().profile?.username ?? 'vi',
          display_name: useAuthStore.getState().profile?.display_name ?? 'Vi',
          avatar_url: useAuthStore.getState().profile?.avatar_url ?? '',
        },
      } as Message

      queryClient.setQueryData(messageKey, (current: any) => ({
        ...(current ?? {}),
        messages: [...(current?.messages ?? []), optimisticMessage],
      }))

      return { previousThread, messageKey }
    },
    onSuccess: async () => {
      setComposing('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations() })
    },
    onError: (_error, _variables, context) => {
      if (context?.previousThread) {
        queryClient.setQueryData(context.messageKey, context.previousThread)
      }
      toast.error(t('messages_send_error'))
    },
  })

  if (isLoading) return <ListSkeleton items={6} avatarSize={28} />
  if (!conversation) return null

  return (
    <>
      <Helmet><title>{other?.display_name ?? t('nav_messages')} — Verdkomunumo</title></Helmet>

      <div className="chat-header">
        <Link to={routes.messages} className="back">←</Link>
        {other && (
          <>
            <PresenceAvatar
              userId={other.id}
              avatarUrl={other.avatar_url}
              displayName={other.display_name}
              wrapperClassName="ava-wrap"
              imageClassName="ava"
              dotClassName="ava-dot"
            />
            <div className="chat-info">
              <Link to={routes.profile(other.username)} className="chat-name">{other.display_name}</Link>
              <span className="chat-user">@{other.username}</span>
            </div>
          </>
        )}
        {isFetching && <InlineSpinner size={13} className="ml-auto text-[var(--color-primary)]" />}
      </div>

      <div className="msgs" ref={msgsEl}>
        {messages.length === 0 ? (
          <div className="empty-thread">
            <p className="empty-title">{t('messages_thread_empty')}</p>
            <p className="empty-copy">{t('messages_thread_empty_hint')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={`row${isMe ? ' me' : ''}`}>
                {!isMe && msg.sender && (
                  <PresenceAvatar
                    userId={msg.sender.id}
                    avatarUrl={msg.sender.avatar_url}
                    displayName={msg.sender.display_name}
                    wrapperClassName="msg-ava-wrap"
                    imageClassName="msg-ava"
                    dotClassName="msg-dot"
                  />
                )}
                <div className={`bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                  <p>{msg.content}</p>
                  <span className="ts">{formatDate(msg.created_at)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form className="compose" onSubmit={(e) => { e.preventDefault(); sendMutation.mutate() }}>
        <textarea
          ref={textAreaEl}
          value={composing}
          onChange={(e) => setComposing(e.target.value)}
          name="content"
          rows={1}
          placeholder={t('messages_placeholder')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              if (!sendMutation.isPending && composing.trim()) {
                sendMutation.mutate()
              }
            }
          }}
        />
        <button type="submit" disabled={sendMutation.isPending || composing.trim().length === 0}>
          {sendMutation.isPending ? <InlineSpinner size={13} className="mr-1.5" /> : null}
          {sendMutation.isPending ? t('messages_sending') : t('messages_send')}
        </button>
      </form>

      <style>{`
        .chat-header { display: flex; align-items: center; gap: 0.65rem; padding-bottom: 0.875rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem; }
        .back { font-size: 1.1rem; color: var(--color-text-muted); text-decoration: none; flex-shrink: 0; padding: 0.2rem; transition: color 0.12s; }
        .back:hover { color: var(--color-text); }
        .ava-wrap { width: 36px; height: 36px; }
        .ava { width: 36px; height: 36px; }
        .ava-dot { width: 10px; height: 10px; right: -1px; bottom: -1px; }
        .chat-info { min-width: 0; }
        .chat-name { font-size: 0.9rem; font-weight: 600; color: var(--color-text); text-decoration: none; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-name:hover { text-decoration: underline; }
        .chat-user { font-size: 0.775rem; color: var(--color-text-muted); }
        .msgs { display: flex; flex-direction: column; gap: 0.5rem; min-height: 320px; max-height: 60vh; overflow-y: auto; margin-bottom: 1rem; scroll-behavior: smooth; }
        .empty-thread { margin: auto 0; padding: 2.5rem 1rem; text-align: center; }
        .empty-title { margin: 0 0 0.45rem; color: var(--color-text); font-weight: 700; }
        .empty-copy { margin: 0; color: var(--color-text-muted); font-size: 0.88rem; }
        .row { display: flex; align-items: flex-end; gap: 0.45rem; }
        .row.me { flex-direction: row-reverse; }
        .msg-ava-wrap { width: 28px; height: 28px; }
        .msg-ava { width: 28px; height: 28px; }
        .msg-dot { width: 9px; height: 9px; right: -1px; bottom: -1px; }
        .bubble { max-width: 68%; padding: 0.55rem 0.85rem; border-radius: 14px; }
        .bubble p { margin: 0 0 0.18rem; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
        .ts { font-size: 0.68rem; display: block; text-align: right; }
        .bubble-me { background: var(--color-primary); border-bottom-right-radius: 4px; color: white; }
        .bubble-me .ts { color: rgba(255,255,255,0.72); }
        .bubble-them { background: var(--color-surface-alt); border-bottom-left-radius: 4px; color: var(--color-text); }
        .bubble-them .ts { color: var(--color-text-muted); }
        .compose { display: flex; align-items: flex-end; gap: 0.65rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem; }
        .compose textarea { flex: 1; min-height: 42px; max-height: 140px; resize: none; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); border-radius: 14px; padding: 0.7rem 0.85rem; font: inherit; line-height: 1.5; outline: none; }
        .compose textarea:focus { border-color: var(--color-primary); }
        .compose button { flex-shrink: 0; border: 0; background: var(--color-primary); color: white; font: inherit; font-size: 0.84rem; font-weight: 700; border-radius: 999px; padding: 0.72rem 1rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .compose button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  )
}
