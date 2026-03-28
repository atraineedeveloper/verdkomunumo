<script lang="ts">
  import { t } from '$lib/i18n'
  import { page } from '$app/state'
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
</script>

<svelte:head>
  <title>{other?.display_name ?? $t('nav_messages')} — Verdkomunumo</title>
</svelte:head>

<!-- Chat header -->
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

<!-- Messages -->
<div class="msgs">
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
</div>

<!-- Compose -->
<form method="POST" action="?/send" class="compose">
  <input name="content" type="text" placeholder={$t('messages_placeholder')} autocomplete="off" />
  <button type="submit">{$t('messages_send')}</button>
</form>

<style>
  /* ── Header ── */
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

  /* ── Messages ── */
  .msgs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 320px;
    margin-bottom: 1rem;
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

  /* ── Compose ── */
  .compose {
    display: flex;
    gap: 0.4rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.35rem 0.35rem 0.35rem 0.85rem;
    align-items: center;
    transition: border-color 0.12s;
  }
  .compose:focus-within { border-color: var(--color-primary); }

  .compose input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    color: var(--color-text);
    outline: none;
    font-family: inherit;
  }

  .compose input::placeholder { color: var(--color-text-muted); }

  .compose button {
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.38rem 0.85rem;
    font-size: 0.825rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.12s;
    flex-shrink: 0;
  }
  .compose button:hover { opacity: 0.85; }
</style>
