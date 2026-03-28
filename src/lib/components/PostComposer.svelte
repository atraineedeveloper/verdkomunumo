<script lang="ts">
  import { t, type TranslationKey } from '$lib/i18n'
  import { DEMO_MODE } from '$lib/mock'
  import type { Category } from '$lib/types'

  interface Props {
    categories: Category[]
    defaultCategoryId?: string
  }

  let { categories, defaultCategoryId = '' }: Props = $props()

  let content    = $state('')
  let categoryId = $state(defaultCategoryId || (categories[0]?.id ?? ''))
  let toast      = $state(false)
  let focused    = $state(false)

  const remaining = $derived(5000 - content.length)
  const canPost   = $derived(content.trim().length > 0 && categoryId !== '' && remaining >= 0)

  function handleSubmit(e: SubmitEvent) {
    if (DEMO_MODE) {
      e.preventDefault()
      toast = true
      setTimeout(() => (toast = false), 2500)
    }
  }
</script>

<div class="composer">
  {#if toast}
    <div class="toast" role="status">{$t('post_compose_demo')}</div>
  {/if}

  <form method="POST" action="?/createPost" onsubmit={handleSubmit}
    onfocusin={() => (focused = true)}
    onfocusout={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node) && !content.trim()) focused = false
    }}
  >
    <textarea
      name="content"
      bind:value={content}
      placeholder={$t('post_compose_placeholder')}
      maxlength={5000}
      rows={focused ? 4 : 2}
    ></textarea>

    {#if focused || content.trim()}
      <div class="bar">
        <select name="category_id" bind:value={categoryId}>
          {#each categories as cat}
            <option value={cat.id}>{$t(('cat_name_' + cat.slug) as TranslationKey)}</option>
          {/each}
        </select>

        <span class="chars" class:warn={remaining < 200} class:over={remaining < 0}>
          {remaining}
        </span>

        <button type="submit" class="post-btn" disabled={!canPost}>
          {$t('post_compose_btn')}
        </button>
      </div>
    {/if}
  </form>
</div>

<style>
  .composer {
    position: relative;
    border-bottom: 1px solid var(--color-border);
    padding: 0.85rem 0 0.85rem;
    margin-bottom: 0.25rem;
  }

  .toast {
    position: absolute;
    top: -2.25rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-text);
    color: var(--color-bg);
    font-size: 0.78rem;
    padding: 0.35rem 0.85rem;
    border-radius: 5px;
    white-space: nowrap;
    pointer-events: none;
  }

  textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-text);
    font-family: inherit;
    display: block;
  }

  textarea::placeholder { color: var(--color-text-muted); }

  .bar {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--color-border);
    margin-top: 0.5rem;
    animation: fadeIn 0.12s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-3px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  select {
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    border-radius: 5px;
    color: var(--color-text);
    font-size: 0.8rem;
    font-family: inherit;
    padding: 0.28rem 0.55rem;
    cursor: pointer;
    transition: border-color 0.12s;
  }

  select:hover { border-color: var(--color-primary); }

  .chars {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .chars.warn { color: #d97706; }
  .chars.over { color: var(--color-danger); font-weight: 600; }

  .post-btn {
    margin-left: auto;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 5px;
    padding: 0.35rem 0.9rem;
    font-size: 0.825rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.12s;
    font-family: inherit;
  }

  .post-btn:not(:disabled):hover { opacity: 0.85; }
  .post-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
