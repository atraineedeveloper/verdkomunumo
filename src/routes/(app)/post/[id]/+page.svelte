<script lang="ts">
  import { t, type TranslationKey } from '$lib/i18n'
  import { formatDate, getAvatarUrl } from '$lib/utils'
  import { CATEGORY_COLORS } from '$lib/icons'
  import { Heart, MessageSquare } from 'lucide-svelte'
  import PostMedia from '$lib/components/PostMedia.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const { post, comments } = data
</script>

<svelte:head>
  <title>{post.author?.display_name ?? 'Afiŝo'} — Verdkomunumo</title>
</svelte:head>

<a href="/feed" class="back">{$t('post_back')}</a>

<!-- Post -->
<article class="post">
  <div class="author-row">
    {#if post.author}
      <a href="/profile/{post.author.username}" class="ava-link">
        <img
          src={getAvatarUrl(post.author.avatar_url, post.author.display_name)}
          alt={post.author.display_name}
          class="ava"
        />
      </a>
      <div class="author-info">
        <a href="/profile/{post.author.username}" class="dname">{post.author.display_name}</a>
        <span class="muted">@{post.author.username}</span>
      </div>
    {/if}
    {#if post.category}
      {@const catColor = CATEGORY_COLORS[post.category.slug]}
      <a href="/category/{post.category.slug}" class="cat-tag"
         style="color: {catColor}; background: {catColor}15">
        {$t(('cat_name_' + post.category.slug) as TranslationKey)}
      </a>
    {/if}
  </div>

  <p class="content">{post.content}</p>
  {#if post.image_urls?.length}
    <PostMedia urls={post.image_urls} alt={post.author?.display_name ?? ''} />
  {/if}

  <div class="post-footer">
    <span class="time">{formatDate(post.created_at)}</span>
    {#if post.is_edited}<span class="edited">{$t('post_edited')}</span>{/if}
    <div class="stats">
      <button class="act"><Heart size={14} strokeWidth={1.75} /> {post.likes_count}</button>
      <span class="muted"><MessageSquare size={14} strokeWidth={1.75} /> {post.comments_count}</span>
    </div>
  </div>
</article>

<!-- Comment composer -->
<div class="compose">
  <form method="POST" action="?/comment">
    <textarea
      name="content"
      placeholder={$t('post_comment_placeholder')}
      rows={2}
    ></textarea>
    <div class="compose-footer">
      <button type="submit" class="btn">{$t('post_comment_btn')}</button>
    </div>
  </form>
</div>

<!-- Comments -->
<section class="comments">
  <h2>{$t('post_comments')} <span class="count">({comments.length})</span></h2>

  {#if comments.length === 0}
    <p class="empty">{$t('post_no_comments')}</p>
  {:else}
    {#each comments as comment}
      <div class="comment">
        <div class="left">
          {#if comment.author}
            <a href="/profile/{comment.author.username}" class="ava-link">
              <img
                src={getAvatarUrl(comment.author.avatar_url, comment.author.display_name)}
                alt={comment.author.display_name}
                class="ava-sm"
              />
            </a>
          {/if}
        </div>
        <div class="right">
          <div class="cmeta">
            {#if comment.author}
              <a href="/profile/{comment.author.username}" class="dname">{comment.author.display_name}</a>
              <span class="muted">@{comment.author.username}</span>
              <span class="muted">·</span>
              <span class="muted small">{formatDate(comment.created_at)}</span>
            {/if}
          </div>
          <p class="ccontent">{comment.content}</p>
          <button class="act"><Heart size={13} strokeWidth={1.75} /> {comment.likes_count}</button>
        </div>
      </div>
    {/each}
  {/if}
</section>

<style>
  /* ── Back link ── */
  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.825rem;
    color: var(--color-text-muted);
    text-decoration: none;
    margin-bottom: 1.25rem;
    transition: color 0.12s;
  }
  .back:hover { color: var(--color-text); }

  /* ── Post ── */
  .post {
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0;
  }

  .author-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .ava-link { display: block; text-decoration: none; flex-shrink: 0; }

  .ava {
    width: 40px;
    height: 40px;
    border-radius: 99px;
    object-fit: cover;
    transition: opacity 0.15s;
  }

  .ava-link:hover .ava { opacity: 0.8; }

  .author-info { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 0.4rem; flex-wrap: wrap; }

  .dname {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
  }
  .dname:hover { text-decoration: underline; }

  .muted { font-size: 0.82rem; color: var(--color-text-muted); }
  .small { font-size: 0.78rem; }

  .cat-tag {
    margin-left: auto;
    font-size: 0.7rem;
    padding: 0.1rem 0.45rem;
    border-radius: 99px;
    font-weight: 500;
    text-decoration: none;
    flex-shrink: 0;
    white-space: nowrap;
    transition: opacity 0.12s;
  }
  .cat-tag:hover { opacity: 0.75; }

  .content {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--color-text);
    white-space: pre-wrap;
    margin: 0 0 1.25rem;
  }

  .post-footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
  }

  .time { color: var(--color-text-muted); }

  .edited {
    color: var(--color-text-muted);
    font-style: italic;
  }

  .stats { display: flex; gap: 0.5rem; margin-left: auto; }

  /* ── Compose ── */
  .compose {
    padding: 0.85rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .compose textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--color-text);
    font-family: inherit;
    display: block;
    margin-bottom: 0.6rem;
  }

  .compose textarea::placeholder { color: var(--color-text-muted); }

  .compose-footer { display: flex; justify-content: flex-end; }

  /* ── Comments ── */
  .comments { margin-top: 0.25rem; }

  .comments h2 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    padding: 0.75rem 0;
    margin: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .count { color: var(--color-text-muted); font-weight: 400; }

  .empty {
    text-align: center;
    padding: 2.5rem 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .comment {
    display: flex;
    gap: 0.75rem;
    padding: 0.9rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .left { flex-shrink: 0; }

  .ava-sm {
    width: 32px;
    height: 32px;
    border-radius: 99px;
    object-fit: cover;
    display: block;
  }

  .right { flex: 1; min-width: 0; }

  .cmeta {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.3rem;
    font-size: 0.82rem;
  }

  .ccontent {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--color-text);
    white-space: pre-wrap;
    margin: 0 0 0.45rem;
  }

  /* ── Shared ── */
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
    font-family: inherit;
  }
  .act:hover { color: var(--color-primary); background: var(--color-primary-dim); }

  .btn {
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 5px;
    padding: 0.35rem 0.9rem;
    font-size: 0.825rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.12s;
  }
  .btn:hover { opacity: 0.85; }
</style>
