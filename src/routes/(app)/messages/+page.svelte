<script lang="ts">
  import { t } from '$lib/i18n'
  import { page } from '$app/state'
  import { formatDate, getAvatarUrl } from '$lib/utils'
  import type { Profile } from '$lib/types'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const myId = $derived(page.data.profile?.id ?? '')

  function getOther(conv: (typeof data.conversations)[0]) {
    return conv.participants?.find((p: Profile) => p.id !== myId) ?? conv.participants?.[0]
  }
</script>

<svelte:head>
  <title>{$t('nav_messages')} — Verdkomunumo</title>
</svelte:head>

<div class="header">
  <h1>{$t('nav_messages')}</h1>
</div>

{#if data.conversations.length === 0}
  <p class="empty">{$t('messages_empty')}</p>
{:else}
  <div class="list">
    {#each data.conversations as conv}
      {@const other = getOther(conv)}
      <a href="/messages/{conv.id}" class="row" class:unread={(conv.unread_count ?? 0) > 0}>
        {#if other}
          <img src={getAvatarUrl(other.avatar_url, other.display_name)}
               alt={other.display_name} class="ava" />
        {/if}

        <div class="body">
          <div class="top">
            <span class="name">{other?.display_name ?? '?'}</span>
            {#if conv.last_message}
              <span class="time">{formatDate(conv.last_message.created_at)}</span>
            {/if}
          </div>
          {#if conv.last_message}
            <p class="preview">{conv.last_message.content}</p>
          {/if}
        </div>

        {#if (conv.unread_count ?? 0) > 0}
          <span class="badge">{conv.unread_count}</span>
        {/if}
      </a>
    {/each}
  </div>
{/if}

<style>
  .header {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0.25rem;
  }

  h1 {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin: 0;
  }

  .empty {
    text-align: center;
    padding: 3rem 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .list { display: flex; flex-direction: column; }

  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--color-border);
    text-decoration: none;
    transition: background 0.12s;
    border-radius: 6px;
  }

  .row:hover { background: var(--color-surface-alt); padding-left: 0.5rem; padding-right: 0.5rem; margin: 0 -0.5rem; }
  .row.unread .name { font-weight: 700; }
  .row.unread .preview { color: var(--color-text); }

  .ava {
    width: 44px;
    height: 44px;
    border-radius: 99px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .body { flex: 1; min-width: 0; }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.2rem;
  }

  .name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .time {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .preview {
    font-size: 0.825rem;
    color: var(--color-text-muted);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge {
    background: var(--color-primary);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 700;
    border-radius: 99px;
    padding: 0.15rem 0.45rem;
    min-width: 20px;
    text-align: center;
    flex-shrink: 0;
  }
</style>
