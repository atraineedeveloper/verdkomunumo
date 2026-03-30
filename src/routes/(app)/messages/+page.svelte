<script lang="ts">
  import { enhance } from '$app/forms'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { withPendingAction } from '$lib/forms/pending'
  import { t } from '$lib/i18n'
  import { DEMO_MODE } from '$lib/mock'
  import { toastStore } from '$lib/stores/toasts'
  import { formatDate, getAvatarUrl } from '$lib/utils'
  import type { Profile } from '$lib/types'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const myId = $derived(page.data.profile?.id ?? '')

  function getOther(conv: (typeof data.conversations)[0]) {
    return conv.participants?.find((p: Profile) => p.id !== myId) ?? conv.participants?.[0]
  }

  let showNew = $state(false)
  let search = $state('')
  let results = $state<Profile[]>([])
  let searching = $state(false)
  let startingConversation = $state<string | null>(null)
  let timer: ReturnType<typeof setTimeout>

  async function onSearch() {
    if (search.trim().length < 2) {
      results = []
      return
    }

    clearTimeout(timer)
    timer = setTimeout(async () => {
      searching = true
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`)
        if (res.ok) {
          results = await res.json()
        }
      } finally {
        searching = false
      }
    }, 300)
  }

  $effect(() => {
    const newUser = page.url.searchParams.get('new')
    if (newUser) {
      search = newUser
      showNew = true
      onSearch()
    }
  })
</script>

<svelte:head>
  <title>{$t('nav_messages')} — Verdkomunumo</title>
</svelte:head>

<div class="header">
  <h1>{$t('nav_messages')}</h1>
  <button class="btn-new" onclick={() => { showNew = true; search = ''; results = [] }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    {$t('messages_new')}
  </button>
</div>

{#if data.conversations.length === 0}
  <div class="empty-state">
    <p class="empty">{$t('messages_empty')}</p>
    <button class="btn-new-lg" onclick={() => { showNew = true; search = ''; results = [] }}>
      {$t('messages_start')}
    </button>
  </div>
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
          {:else}
            <p class="preview muted">{$t('messages_thread_empty')}</p>
          {/if}
        </div>

        {#if (conv.unread_count ?? 0) > 0}
          <span class="badge">{conv.unread_count}</span>
        {/if}
      </a>
    {/each}
  </div>
{/if}

{#if showNew}
  <button class="veil" onclick={() => (showNew = false)} tabindex="-1" aria-hidden="true"></button>
  <div class="modal" role="dialog" aria-label="Nuevo mensaje">
    <div class="modal-head">
      <span class="modal-title">{$t('messages_new')}</span>
      <button class="modal-close" onclick={() => (showNew = false)}>×</button>
    </div>
    <div class="modal-search">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        type="text"
        bind:value={search}
        oninput={onSearch}
        placeholder={$t('messages_search_placeholder')}
      />
    </div>

    <div class="modal-results">
      {#if searching}
        <p class="hint">{$t('messages_searching')}</p>
      {:else if search.trim().length >= 2 && results.length === 0}
        <p class="hint">{$t('messages_no_results')}</p>
      {:else if search.trim().length < 2}
        <p class="hint">{$t('messages_search_hint')}</p>
      {:else}
        {#each results as user}
          <form method="POST" action="?/start" use:enhance={withPendingAction(() => {
            startingConversation = user.id
            return async ({ result, update }) => {
              startingConversation = null
              await update({ reset: false })

              if (result.type === 'redirect') {
                goto(result.location)
                return
              }

              if (result.type === 'failure') {
                toastStore.error((result.data as { message?: string } | null)?.message ?? $t('messages_start_error'))
                return
              }

              if (result.type === 'error') {
                toastStore.error($t('messages_start_error'))
              }
            }
          })}>
            <input type="hidden" name="target_id" value={user.id} />
            <button type="submit" class="result-row" disabled={startingConversation === user.id || DEMO_MODE}>
              <img src={getAvatarUrl(user.avatar_url, user.display_name)} alt={user.display_name} class="result-ava" />
              <div>
                <span class="result-name">{user.display_name}</span>
                <span class="result-user">@{user.username}</span>
              </div>
              <span class="result-cta">
                {startingConversation === user.id ? $t('messages_opening') : $t('messages_start')}
              </span>
            </button>
          </form>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

  .btn-new {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.38rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.12s;
  }
  .btn-new:hover { opacity: 0.85; }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 0;
  }

  .empty {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .btn-new-lg {
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.55rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.12s;
  }
  .btn-new-lg:hover { opacity: 0.85; }

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
    margin: 0;
    font-size: 0.82rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview.muted { font-style: italic; }

  .badge {
    min-width: 1.2rem;
    height: 1.2rem;
    padding: 0 0.3rem;
    border-radius: 999px;
    background: var(--color-primary);
    color: #fff;
    font-size: 0.72rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  .veil {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    z-index: 40;
  }

  .modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(92vw, 420px);
    max-height: 75vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.18);
    z-index: 50;
    overflow: hidden;
  }

  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .modal-close {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 1.35rem;
    cursor: pointer;
    line-height: 1;
  }

  .modal-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-muted);
  }

  .modal-search input {
    flex: 1;
    border: none;
    background: transparent;
    font: inherit;
    color: var(--color-text);
    outline: none;
  }

  .modal-results {
    padding: 0.5rem;
    overflow: auto;
  }

  .hint {
    margin: 0;
    padding: 1rem 0.6rem;
    color: var(--color-text-muted);
    font-size: 0.84rem;
    text-align: center;
  }

  .result-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem;
    border: none;
    background: transparent;
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    color: var(--color-text);
    font-family: inherit;
  }
  .result-row:disabled { opacity: 0.65; cursor: wait; }
  .result-row:hover { background: var(--color-surface-alt); }

  .result-ava {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .result-name {
    display: block;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .result-user {
    display: block;
    font-size: 0.78rem;
    color: var(--color-text-muted);
  }

  .result-cta {
    margin-left: auto;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-primary);
    flex-shrink: 0;
  }
</style>
