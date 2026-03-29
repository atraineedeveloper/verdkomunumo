<script lang="ts">
  import { t, type TranslationKey } from '$lib/i18n'
  import { formatDate, getAvatarUrl } from '$lib/utils'
  import { CATEGORY_ICONS, CATEGORY_COLORS } from '$lib/icons'
  import { Heart, MessageSquare } from 'lucide-svelte'
  import PostComposer from '$lib/components/PostComposer.svelte'
  import PostMedia from '$lib/components/PostMedia.svelte'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
  const category   = $derived(data.category)
  const posts      = $derived(data.posts)
  const categories = $derived(data.categories)
</script>

<svelte:head>
  <title>{category.icon} {$t(('cat_name_' + category.slug) as TranslationKey)} — Verdkomunumo</title>
</svelte:head>

<!-- Header -->
<div class="cat-header">
  <span class="cat-icon" style="color: {CATEGORY_COLORS[category.slug] ?? 'var(--color-primary)'}">
    {#if CATEGORY_ICONS[category.slug]}
      {@const HeroIcon = CATEGORY_ICONS[category.slug]}
      <HeroIcon size={32} strokeWidth={1.5} />
    {/if}
  </span>
  <div class="cat-info">
    <h1>{$t(('cat_name_' + category.slug) as TranslationKey)}</h1>
    <p>{$t(('cat_desc_' + category.slug) as TranslationKey)}</p>
  </div>
</div>

<PostComposer {categories} defaultCategoryId={category.id} {form} />

{#if posts.length === 0}
  <p class="empty">{$t('category_empty')}</p>
{:else}
  <div class="timeline">
    {#each posts as post}
      <article class="entry">
        <div class="left">
          {#if post.author}
            <a href="/profile/{post.author.username}" class="ava-link">
              <img
                src={getAvatarUrl(post.author.avatar_url, post.author.display_name)}
                alt={post.author.display_name}
                class="ava"
              />
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
          </div>
          <a href="/post/{post.id}" class="body">
            <p class="content">{post.content}</p>
          </a>
          {#if post.image_urls?.length}
            <PostMedia urls={post.image_urls} alt={post.author?.display_name ?? ''} />
          {/if}
          <div class="actions">
            <form method="POST" action={`/post/${post.id}?/toggleLike`}>
              <button type="submit" class="act"><Heart size={14} strokeWidth={1.75} /> <span>{post.likes_count}</span></button>
            </form>
            <a href="/post/{post.id}" class="act"><MessageSquare size={14} strokeWidth={1.75} /> <span>{post.comments_count}</span></a>
          </div>
        </div>
      </article>
    {/each}
  </div>
{/if}

<style>
  /* ── Category header ── */
  .cat-header {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1rem;
  }

  .cat-icon { font-size: 2rem; flex-shrink: 0; line-height: 1; }

  .cat-info { flex: 1; min-width: 0; }

  .cat-info h1 {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin: 0 0 0.2rem;
  }

  .cat-info p {
    font-size: 0.825rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  /* ── Empty ── */
  .empty {
    text-align: center;
    padding: 3rem 0;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  /* ── Timeline (same as feed) ── */
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

  .ava {
    width: 38px;
    height: 38px;
    border-radius: 99px;
    object-fit: cover;
    display: block;
    transition: opacity 0.15s;
  }

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

  .dname {
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
  }
  .dname:hover { text-decoration: underline; }

  .muted { color: var(--color-text-muted); }
  .small { font-size: 0.8rem; }

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

  .actions {
    display: flex;
    gap: 0.15rem;
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

  .act:hover { color: var(--color-primary); background: var(--color-primary-dim); }
  .act span { font-variant-numeric: tabular-nums; }
</style>
