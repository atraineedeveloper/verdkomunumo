<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import { withPendingAction } from '$lib/forms/pending'
  import { t, type TranslationKey } from '$lib/i18n'
  import { toastStore } from '$lib/stores/toasts'
  import { formatDate } from '$lib/utils'
  import { CATEGORY_COLORS } from '$lib/icons'
  import { Heart, MessageSquare, TriangleAlert, X } from 'lucide-svelte'
  import PostComposer from '$lib/components/PostComposer.svelte'
  import PostMedia from '$lib/components/PostMedia.svelte'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
  let showBetaNotice = $state(true)
  const BETA_NOTICE_KEY = 'verdkomunumo-beta-notice-dismissed'

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

  onMount(() => {
    showBetaNotice = localStorage.getItem(BETA_NOTICE_KEY) !== 'true'
  })

  function dismissBetaNotice() {
    showBetaNotice = false
    localStorage.setItem(BETA_NOTICE_KEY, 'true')
  }
</script>

<svelte:head>
  <title>{$t('feed_title')} — Verdkomunumo</title>
</svelte:head>

<div class="page-header">
  <h1>{$t('feed_title')}</h1>
  <nav class="tabs">
    <a href="/feed" class="tab active">{$t('feed_all')}</a>
    <a href="/feed?filter=following" class="tab">{$t('feed_following')}</a>
  </nav>
</div>

{#if showBetaNotice}
  <aside class="beta-banner" role="status" aria-live="polite">
    <div class="beta-icon">
      <TriangleAlert size={24} strokeWidth={2.15} />
    </div>
    <div class="beta-copy">
      <strong>{$t('beta_banner_title')}</strong>
      <span>{$t('beta_banner_body')}</span>
    </div>
    <button type="button" class="beta-close" onclick={dismissBetaNotice} aria-label={$t('beta_banner_close')}>
      <X size={18} strokeWidth={2.15} />
    </button>
  </aside>
{/if}

<PostComposer categories={data.categories} {form} />

{#if data.posts.length === 0}
  <p class="empty">{$t('feed_empty')}</p>
{:else}
  <div class="timeline">
    {#each data.posts as post}
      <article class="entry">
        <div class="left">
          {#if post.author}
            <a href="/profile/{post.author.username}" class="ava-wrap">
              <img
                src={post.author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.display_name)}&background=16a34a&color=fff`}
                alt={post.author.display_name}
                class="ava"
              />
            </a>
          {/if}
        </div>

        <div class="right">
          <div class="meta">
            {#if post.author}
              <a href="/profile/{post.author.username}" class="display-name">{post.author.display_name}</a>
              <span class="username">@{post.author.username}</span>
              <span class="dot-sep">·</span>
              <span class="time">{formatDate(post.created_at)}</span>
            {/if}
            {#if post.category}
              {@const catColor = CATEGORY_COLORS[post.category.slug]}
              <a href="/category/{post.category.slug}" class="cat-tag"
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

          <div class="actions">
            <form method="POST" action={`/post/${post.id}?/toggleLike`} use:enhance={enhanceLike}>
              <button type="submit" class:liked={post.user_liked} class="act"><Heart size={14} strokeWidth={1.75} /> <span>{post.likes_count}</span></button>
            </form>
            <a href="/post/{post.id}" class="act"><MessageSquare size={14} strokeWidth={1.75} /> <span>{post.comments_count}</span></a>
          </div>
        </div>
      </article>
    {/each}
  </div>
{/if}

<style>
  /* ── Header ── */
  .page-header {
    padding-bottom: 0;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0 0 1rem;
    color: var(--color-text);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    gap: 0;
  }

  .tab {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.12s, border-color 0.12s;
  }

  .tab:hover { color: var(--color-text); }
  .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

  /* ── Empty ── */
  .empty {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    padding: 3rem 0;
    text-align: center;
  }

  /* ── Timeline ── */
  .timeline { display: flex; flex-direction: column; }

  .beta-banner {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding: 0.95rem 1rem;
    border-radius: 0.4rem;
    border: 1px solid #d97706;
    background: linear-gradient(180deg, #fde047 0%, #facc15 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 6px 16px rgba(146, 64, 14, 0.18);
    color: #4a2c00;
  }

  .beta-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.35rem;
    height: 2.35rem;
    padding-right: 0.85rem;
    border-right: 1px solid rgba(122, 53, 0, 0.22);
    color: #7c2d12;
  }

  .beta-copy {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    text-align: center;
  }

  .beta-copy strong {
    font-size: 0.98rem;
    font-weight: 800;
    color: #5b3200;
  }

  .beta-copy span {
    font-size: 0.87rem;
    line-height: 1.35;
    color: #6b3b00;
  }

  .beta-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    color: #6b3b00;
    cursor: pointer;
    transition: background 0.12s ease, transform 0.12s ease;
  }

  .beta-close:hover {
    background: rgba(255, 255, 255, 0.32);
    transform: translateY(-1px);
  }

  .entry {
    display: flex;
    gap: 0.85rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .entry:first-child { border-top: 1px solid var(--color-border); }

  /* Avatar column */
  .left { flex-shrink: 0; }

  .ava-wrap { display: block; text-decoration: none; }

  .ava {
    width: 38px;
    height: 38px;
    border-radius: 99px;
    object-fit: cover;
    display: block;
    transition: opacity 0.15s;
  }

  .ava-wrap:hover .ava { opacity: 0.85; }

  /* Content column */
  .right { flex: 1; min-width: 0; }

  .meta {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.35rem;
    font-size: 0.84rem;
  }

  .display-name {
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
  }
  .display-name:hover { text-decoration: underline; }

  .username { color: var(--color-text-muted); }

  .dot-sep { color: var(--color-text-muted); }

  .time { color: var(--color-text-muted); font-size: 0.8rem; }

  .cat-tag {
    margin-left: auto;
    font-size: 0.7rem;
    text-decoration: none;
    padding: 0.1rem 0.45rem;
    border-radius: 99px;
    font-weight: 500;
    transition: opacity 0.12s;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .cat-tag:hover { opacity: 0.75; }

  /* Post body */
  .body { text-decoration: none; display: block; }

  .content {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-text);
    margin: 0 0 0.65rem;
    white-space: pre-wrap;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    line-clamp: 6;
    -webkit-box-orient: vertical;
  }

  /* Stat actions */
  .actions {
    display: flex;
    gap: 0.15rem;
    margin-top: 0.1rem;
  }

  .actions form { margin: 0; }

  .act {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: none;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    border-radius: 5px;
    cursor: pointer;
    transition: color 0.12s, background 0.12s;
    text-decoration: none;
    font-family: inherit;
  }

  button.act:hover { color: #f43f5e; background: #f43f5e18; }
  button.act.liked {
    color: #e11d48;
    background: #f43f5e18;
  }
  a.act:hover { color: #60a5fa; background: #60a5fa18; }

  .act span { font-variant-numeric: tabular-nums; }

  @media (max-width: 640px) {
    .beta-banner {
      grid-template-columns: 1fr auto;
      align-items: start;
    }

    .beta-icon {
      display: none;
    }

    .beta-copy {
      text-align: left;
    }
  }
</style>
