<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/state'
  import { withPendingAction } from '$lib/forms/pending'
  import { t } from '$lib/i18n'
  import { DEMO_MODE } from '$lib/mock'
  import { toastStore } from '$lib/stores/toasts'
  import { formatDate, getAvatarUrl } from '$lib/utils'
  import type { Profile } from '$lib/types'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const conversation = $derived(data.conversation)
  const messages = $derived(data.messages)
  const myId = $derived(page.data.profile?.id ?? '')
  const other = $derived(
    conversation.participants?.find((p: Profile) => p.id !== myId) ?? conversation.participants?.[0]
  )

  let msgsEl = $state<HTMLElement | null>(null)
  let textAreaEl = $state<HTMLTextAreaElement | null>(null)
  let composing = $state('')
  let sending = $state(false)

  function scrollToBottom() {
    msgsEl?.scrollTo({ top: msgsEl.scrollHeight, behavior: 'smooth' })
  }

  function resizeComposer() {
    if (!textAreaEl) return
    textAreaEl.style.height = '0px'
    textAreaEl.style.height = `${Math.min(textAreaEl.scrollHeight, 140)}px`
  }

  function getResultPayload(data: unknown) {
    return (data ?? {}) as {
      message?: string
      errors?: Record<string, string[] | undefined>
    }
  }

  $effect(() => {
    messages
    setTimeout(scrollToBottom, 50)
  })

  $effect(() => {
    composing
    resizeComposer()
  })
</script>

<svelte:head>
  <title>{other?.display_name ?? $t('nav_messages')} — Verdkomunumo</title>
</svelte:head>

<div class="chat-header">
  <a href="/messages" class="back">←</a>
  {#if other}
    <img src={getAvatarUrl(other.avatar_url, other.display_name)} alt={other.display_name} class="ava" />
    <div class="chat-info">
      <a href="/profile/{other.username}" class="chat-name">{other.display_name}</a>
      <span class="chat-user">@{other.username}</span>
    </div>
  {/if}
</div>

<div class="msgs" bind:this={msgsEl}>
  {#if messages.length === 0}
    <div class="empty-thread">
      <p class="empty-title">{$t('messages_thread_empty')}</p>
      <p class="empty-copy">{$t('messages_thread_empty_hint')}</p>
    </div>
  {:else}
    {#each messages as msg}
      {@const isMe = msg.sender_id === myId}
      <div class="row" class:me={isMe}>
        {#if !isMe && msg.sender}
          <img src={getAvatarUrl(msg.sender.avatar_url, msg.sender.display_name)}
               alt={msg.sender.display_name} class="msg-ava" />
        {/if}
        <div class="bubble" class:bubble-me={isMe} class:bubble-them={!isMe}>
          <p>{msg.content}</p>
          <span class="ts">{formatDate(msg.created_at)}</span>
        </div>
      </div>
    {/each}
  {/if}
</div>

<form method="POST" action="?/send" class="compose" use:enhance={withPendingAction((event) => {
  if (DEMO_MODE) {
    event.cancel()
    toastStore.info($t('post_compose_demo'))
    composing = ''
    return
  }

  sending = true

  return async ({ result, update }) => {
    sending = false

    if (result.type === 'success') {
      composing = ''
      await update({ reset: false })
      await invalidateAll()
      setTimeout(scrollToBottom, 80)
      return
    }

    await update({ reset: false })

    if (result.type === 'failure') {
      const payload = getResultPayload(result.data)
      toastStore.error(payload.message ?? payload.errors?.content?.[0] ?? $t('messages_send_error'))
      return
    }

    if (result.type === 'error') {
      toastStore.error($t('messages_send_error'))
    }
  }
})}>
  <textarea
    bind:this={textAreaEl}
    bind:value={composing}
    name="content"
    rows={1}
    placeholder={$t('messages_placeholder')}
    onkeydown={(event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        if (!sending && composing.trim()) {
          (event.currentTarget as HTMLTextAreaElement).form?.requestSubmit()
        }
      }
    }}
  ></textarea>
  <button type="submit" disabled={sending || composing.trim().length === 0}>
    {sending ? $t('messages_sending') : $t('messages_send')}
  </button>
</form>

<style>
  .chat-header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding-bottom: 0.875rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1rem;
  }

  .back {
    font-size: 1.1rem;
    color: var(--color-text-muted);
    text-decoration: none;
    flex-shrink: 0;
    padding: 0.2rem;
    transition: color 0.12s;
  }
  .back:hover { color: var(--color-text); }

  .ava {
    width: 36px;
    height: 36px;
    border-radius: 99px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .chat-info { min-width: 0; }

  .chat-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chat-name:hover { text-decoration: underline; }

  .chat-user {
    font-size: 0.775rem;
    color: var(--color-text-muted);
  }

  .msgs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 320px;
    max-height: 60vh;
    overflow-y: auto;
    margin-bottom: 1rem;
    scroll-behavior: smooth;
  }

  .empty-thread {
    margin: auto 0;
    padding: 2.5rem 1rem;
    text-align: center;
  }

  .empty-title {
    margin: 0 0 0.45rem;
    color: var(--color-text);
    font-weight: 700;
  }

  .empty-copy {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.88rem;
  }

  .row {
    display: flex;
    align-items: flex-end;
    gap: 0.45rem;
  }
  .row.me { flex-direction: row-reverse; }

  .msg-ava {
    width: 28px;
    height: 28px;
    border-radius: 99px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .bubble {
    max-width: 68%;
    padding: 0.55rem 0.85rem;
    border-radius: 14px;
  }

  .bubble p {
    margin: 0 0 0.18rem;
    font-size: 0.9rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ts {
    font-size: 0.68rem;
    display: block;
    text-align: right;
  }

  .bubble-me {
    background: var(--color-primary);
    border-bottom-right-radius: 4px;
  }
  .bubble-me p  { color: #fff; }
  .bubble-me .ts { color: rgba(255,255,255,0.65); }

  .bubble-them {
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    border-bottom-left-radius: 4px;
  }
  .bubble-them p  { color: var(--color-text); }
  .bubble-them .ts { color: var(--color-text-muted); }

  .compose {
    display: flex;
    gap: 0.4rem;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 0.45rem;
    align-items: flex-end;
    transition: border-color 0.12s;
    background: color-mix(in srgb, var(--color-surface) 94%, white 6%);
  }
  .compose:focus-within { border-color: var(--color-primary); }

  .compose textarea {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    color: var(--color-text);
    outline: none;
    font-family: inherit;
    line-height: 1.5;
    resize: none;
    min-height: 1.5rem;
    max-height: 8.75rem;
    padding: 0.4rem 0.45rem 0.4rem 0.55rem;
  }

  .compose textarea::placeholder { color: var(--color-text-muted); }

  .compose button {
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.62rem 0.9rem;
    font-size: 0.825rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.12s;
    flex-shrink: 0;
  }
  .compose button:hover { opacity: 0.85; }
  .compose button:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
