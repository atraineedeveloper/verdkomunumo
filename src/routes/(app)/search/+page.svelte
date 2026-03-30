<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/state'
  import { withPendingAction } from '$lib/forms/pending'
  import { t, type TranslationKey } from '$lib/i18n'
  import { toastStore } from '$lib/stores/toasts'
  import { formatDate, getAvatarUrl } from '$lib/utils'
  import { CATEGORY_COLORS } from '$lib/icons'
  import { Heart, MessageSquare } from 'lucide-svelte'
  import PostMedia from '$lib/components/PostMedia.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  let query = $state('')
  const tab = $derived(data.tab)
  const filteredPosts = $derived(data.posts)
  const filteredUsers = $derived(data.users)
  const searchHref = $derived((targetTab: 'posts' | 'users') => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    params.set('tab', targetTab)
    const suffix = params.toString()
    return suffix ? `/search?${suffix}` : '/search'
  })

  $effect(() => {
    query = data.q
  })

  const enhanceLike = withPendingAction(() => async ({ result }: { result: any }) => {
      if (result.type === 'success') {
        await invalidateAll()
        return
      }

      if (result.type === 'failure') {
        toastStore.error(result.data?.message ?? $t('toast_action_failed'))
        return
      }

      if (result.type === 'error') {
        toastStore.error($t('toast_action_failed'))
      }
    })
</script>

<svelte:head>
  <title>{$t('search_title')} — Verdkomunumo</title>
</svelte:head>

<div class="search-wrap">
  <form method="GET" class="search-form">
    <input type="hidden" name="tab" value={tab} />
    <input
      type="search"
      bind:value={query}
      name="q"
      placeholder={$t('search_placeholder')}
      class="search-input"
    />
  </form>
</div>

<div class="tabs">
  <a class="tab" class:active={tab === 'posts'} href={searchHref('posts')}>
    {$t('search_posts')}{#if filteredPosts.length > 0} <span class="count">{filteredPosts.length}</span>{/if}
  </a>
  <a class="tab" class:active={tab === 'users'} href={searchHref('users')}>
    {$t('search_users')}{#if filteredUsers.length > 0} <span class="count">{filteredUsers.length}</span>{/if}
  </a>
</div>

{#if data.q.trim().length < 2}
  <p class="hint">{$t('search_hint')}</p>
{:else if tab === 'posts'}
  {#if filteredPosts.length === 0}
    <p class="empty">{$t('search_empty')}</p>
  {:else}
    <div class="timeline">
      {#each filteredPosts as post}
        <article class="entry">
          <div class="left">
            {#if post.author}
              <a href="/profile/{post.author.username}" class="ava-link">
                <img src={getAvatarUrl(post.author.avatar_url, post.author.display_name)}
                     alt={post.author.display_name} class="ava" />
              </a>
            {/if}
          </div>
          <div class="right">
            <div class="meta">
              {#if post.author}
                <a href="/profile/{post.author.username}" class="dname">{post.author.display_name}</a>
                <span class="muted">@{post.author.username}</span>
                <span class="muted">·</span>
                <span class="muted small">{formatDate(post.created_at)}</span>
              {/if}
              {#if post.category}
                {@const catColor = CATEGORY_COLORS[post.category.slug]}
                <a href="/category/{post.category.slug}" class="cat"
                   style="color: {catColor}; background: {catColor}15">
                  {$t(('cat_name_' + post.category.slug) as TranslationKey)}
                </a>
              {/if}
            </div>
            <a href="/post/{post.id}" class="body">
              <p class="content">{post.content}</p>
            </a>
            {#if post.image_urls?.length}
              <PostMedia urls={post.image_urls} alt={post.author?.display_name ?? ''} />
            {/if}
            <div class="acts">
              <form method="POST" action={`/post/${post.id}?/toggleLike`} use:enhance={enhanceLike}>
                <button type="submit" class:liked={post.user_liked} class="act act-btn"><Heart size={13} strokeWidth={1.75} /> {post.likes_count}</button>
              </form>
              <span class="act"><MessageSquare size={13} strokeWidth={1.75} /> {post.comments_count}</span>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
{:else}
  {#if filteredUsers.length === 0}
    <p class="empty">{$t('search_empty')}</p>
  {:else}
    <div class="user-list">
      {#each filteredUsers as user}
        <a href="/profile/{user.username}" class="user-row">
          <img src={getAvatarUrl(user.avatar_url, user.display_name)}
               alt={user.display_name} class="user-ava" />
          <div class="user-info">
            <span class="user-name">{user.display_name}</span>
            <span class="muted">@{user.username}</span>
            {#if user.bio}<p class="user-bio">{user.bio}</p>{/if}
          </div>
          <span class="followers">{user.followers_count} {$t('profile_followers')}</span>
        </a>
      {/each}
    </div>
  {/if}
{/if}

<style>
  /* ── Search input ── */
  .search-wrap {
    margin-bottom: 1rem;
  }

  .search-form {
    margin: 0;
  }

  .search-input {
    width: 100%;
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.55rem 0.9rem;
    font-size: 0.9375rem;
    color: var(--color-text);
    font-family: inherit;
    outline: none;
    transition: border-color 0.12s;
  }
  .search-input:focus { border-color: var(--color-primary); }
  .search-input::placeholder { color: var(--color-text-muted); }

  /* ── Tabs ── */
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0.25rem;
  }

  .tab {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color 0.12s, border-color 0.12s;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    text-decoration: none;
  }
  .tab:hover { color: var(--color-text); }
  .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

  .count {
    font-size: 0.72rem;
    background: var(--color-primary-dim);
    color: var(--color-primary);
    padding: 0.1rem 0.4rem;
    border-radius: 99px;
    font-variant-numeric: tabular-nums;
  }

  /* ── States ── */
  .hint, .empty {
    text-align: center;
    padding: 3rem 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  /* ── Posts timeline ── */
  .timeline { display: flex; flex-direction: column; }

  .entry {
    display: flex;
    gap: 0.85rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
  }
  .entry:first-child { border-top: 1px solid var(--color-border); }

  .left { flex-shrink: 0; }
  .ava-link { display: block; text-decoration: none; }
  .ava { width: 38px; height: 38px; border-radius: 99px; object-fit: cover; display: block; }
  .ava-link:hover .ava { opacity: 0.8; }

  .right { flex: 1; min-width: 0; }

  .meta {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.35rem;
    font-size: 0.84rem;
  }

  .dname { font-weight: 600; color: var(--color-text); text-decoration: none; }
  .dname:hover { text-decoration: underline; }
  .muted { color: var(--color-text-muted); }
  .small { font-size: 0.8rem; }

  .cat {
    margin-left: auto;
    font-size: 0.7rem;
    padding: 0.1rem 0.45rem;
    border-radius: 99px;
    font-weight: 500;
    text-decoration: none;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .body { text-decoration: none; display: block; }
  .content {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--color-text);
    margin: 0 0 0.55rem;
    white-space: pre-wrap;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
  }

  .acts { display: flex; gap: 0.75rem; }
  .act { font-size: 0.8rem; color: var(--color-text-muted); }
  .acts form { margin: 0; }
  .act-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: transparent;
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .act-btn.liked {
    color: #e11d48;
  }

  /* ── Users ── */
  .user-list { display: flex; flex-direction: column; }

  .user-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--color-border);
    text-decoration: none;
    transition: background 0.12s;
    border-radius: 6px;
  }
  .user-row:first-child { border-top: 1px solid var(--color-border); }
  .user-row:hover { background: var(--color-surface-alt); padding-left: 0.5rem; padding-right: 0.5rem; margin: 0 -0.5rem; }

  .user-ava { width: 42px; height: 42px; border-radius: 99px; object-fit: cover; flex-shrink: 0; }
  .user-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .user-name { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
  .user-bio {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0.1rem 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .followers { font-size: 0.75rem; color: var(--color-text-muted); flex-shrink: 0; }
</style>
