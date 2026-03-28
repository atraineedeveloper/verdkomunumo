<script lang="ts">
  import { t, type TranslationKey } from '$lib/i18n'
  import { formatDate } from '$lib/utils'
  import { CATEGORY_COLORS } from '$lib/icons'
  import { Heart, MessageSquare } from 'lucide-svelte'
  import PostComposer from '$lib/components/PostComposer.svelte'
  import PostMedia from '$lib/components/PostMedia.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
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

<PostComposer categories={data.categories} />

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
            <button class="act"><Heart size={14} strokeWidth={1.75} /> <span>{post.likes_count}</span></button>
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
  a.act:hover { color: #60a5fa; background: #60a5fa18; }

  .act span { font-variant-numeric: tabular-nums; }
</style>
