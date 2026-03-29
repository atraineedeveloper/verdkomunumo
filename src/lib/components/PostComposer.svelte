<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { t, type TranslationKey } from '$lib/i18n'
  import { DEMO_MODE } from '$lib/mock'
  import { POST_MAX_IMAGES } from '$lib/constants'
  import { optimizeImageFiles, replaceInputFiles } from '$lib/browser/images'
  import type { Category } from '$lib/types'
  import { onDestroy, onMount } from 'svelte'

  interface Props {
    categories: Category[]
    defaultCategoryId?: string
    form?: {
      success?: boolean
      message?: string
      errors?: Record<string, string[] | undefined>
    } | null
  }

  let { categories, defaultCategoryId = '', form }: Props = $props()

  let content    = $state('')
  let categoryId = $state('')
  let toast      = $state(false)
  let focused    = $state(false)
  let fileInput = $state<HTMLInputElement | null>(null)
  let submitting = $state(false)
  let preparingImages = $state(false)
  let imageCount = $state(0)
  let imagePreviews = $state<string[]>([])
  let selectedFiles = $state<File[]>([])
  const formErrors = $derived((form?.errors ?? {}) as Record<string, string[] | undefined>)

  $effect(() => {
    const nextCategoryId = defaultCategoryId || (categories[0]?.id ?? '')
    if (!categoryId || !categories.some((category) => category.id === categoryId)) {
      categoryId = nextCategoryId
    }
  })

  const remaining = $derived(5000 - content.length)
  const canPost   = $derived(content.trim().length > 0 && categoryId !== '' && remaining >= 0)

  function resetComposer() {
    content = ''
    focused = false
    setFiles([])
  }

  function revokePreviews() {
    for (const preview of imagePreviews) {
      URL.revokeObjectURL(preview)
    }
  }

  function setFiles(files: File[]) {
    revokePreviews()
    selectedFiles = files
    imageCount = files.length
    imagePreviews = files.map((file) => URL.createObjectURL(file))
    replaceInputFiles(fileInput, files)
  }

  function mergeFiles(existingFiles: File[], nextFiles: File[]) {
    const merged = [...existingFiles]
    const seen = new Set(existingFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`))

    for (const file of nextFiles) {
      const key = `${file.name}:${file.size}:${file.lastModified}`
      if (seen.has(key)) continue
      merged.push(file)
      seen.add(key)
      if (merged.length >= POST_MAX_IMAGES) break
    }

    return merged
  }

  async function onFilesChange(event: Event) {
    const files = (event.currentTarget as HTMLInputElement).files
    if (!files) return

    preparingImages = true
    const optimizedFiles = await optimizeImageFiles(Array.from(files).slice(0, POST_MAX_IMAGES))
    setFiles(mergeFiles(selectedFiles, optimizedFiles).slice(0, POST_MAX_IMAGES))
    preparingImages = false
    focused = true
  }

  function removeImage(index: number) {
    setFiles(selectedFiles.filter((_, i) => i !== index))
  }

  function handleSubmit(e: SubmitEvent) {
    if (DEMO_MODE) {
      e.preventDefault()
      toast = true
      setTimeout(() => (toast = false), 2500)
      return
    }
  }

  onDestroy(() => {
    revokePreviews()
  })
</script>

<div class="composer">
  {#if toast}
    <div class="toast" role="status">{$t('post_compose_demo')}</div>
  {/if}

  {#if form?.message}
    <div class="error-banner" role="alert">{form.message}</div>
  {/if}

  {#if form?.success}
    <div class="success-banner" role="status">Afiŝo publikigita.</div>
  {/if}

  <form method="POST" action="?/createPost" enctype="multipart/form-data" onsubmit={handleSubmit}
    use:enhance={() => {
      if (DEMO_MODE) return
      submitting = true

      return async ({ result, update }) => {
        submitting = false
        await update({ reset: false })

        if (result.type === 'success') {
          resetComposer()
          await invalidateAll()
        }
      }
    }}
    onfocusin={() => (focused = true)}
    onfocusout={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node) && !content.trim() && imagePreviews.length === 0) focused = false
    }}
  >
    <textarea
      name="content"
      bind:value={content}
      placeholder={$t('post_compose_placeholder')}
      maxlength={5000}
      rows={focused ? 4 : 2}
    ></textarea>
    {#if form?.errors?.content}
      <span class="field-error">{formErrors.content?.[0]}</span>
    {/if}

    {#if imagePreviews.length > 0}
      <div class="img-previews">
        {#each imagePreviews as src, i}
          <div class="img-thumb">
            <img {src} alt="preview {i + 1}" />
            <button type="button" class="img-remove" onclick={() => removeImage(i)} onmousedown={(e) => e.preventDefault()} aria-label="Quitar imagen">×</button>
          </div>
        {/each}
      </div>
    {/if}

    {#if focused || content.trim() || imagePreviews.length > 0}
      <div class="bar">
        <select name="category_id" bind:value={categoryId}>
          {#each categories as cat}
            <option value={cat.id}>{$t(('cat_name_' + cat.slug) as TranslationKey)}</option>
          {/each}
        </select>
        {#if formErrors.category_id}
          <span class="field-error">{formErrors.category_id?.[0]}</span>
        {/if}

        <button
          type="button"
          class="file-btn"
          title="Adjuntar imágenes"
          onmousedown={(event) => event.preventDefault()}
          onclick={() => {
            focused = true
            fileInput?.click()
          }}
        >
          <input
            bind:this={fileInput}
            type="file"
            name="images"
            accept="image/*"
            multiple
            class="sr-only-input"
            onchange={onFilesChange}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {#if imageCount > 0}<span class="file-count">{imageCount}/{POST_MAX_IMAGES}</span>{/if}
        </button>

        <span class="chars" class:warn={remaining < 200} class:over={remaining < 0}>
          {remaining}
        </span>

        <button type="submit" class="post-btn" disabled={!canPost || submitting || preparingImages}>
          {preparingImages ? 'Preparando imágenes...' : submitting ? 'Publicando...' : $t('post_compose_btn')}
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

  .error-banner,
  .success-banner {
    border-radius: 8px;
    font-size: 0.82rem;
    margin-bottom: 0.75rem;
    padding: 0.55rem 0.7rem;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .success-banner {
    background: #f0fdf4;
    border: 1px solid #86efac;
    color: #166534;
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

  .field-error {
    color: #dc2626;
    display: block;
    font-size: 0.8rem;
    margin-top: 0.35rem;
  }

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

  .file-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    border-radius: 5px;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    padding: 0.28rem 0.55rem;
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s;
    white-space: nowrap;
  }

  .file-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

  .sr-only-input {
    display: none;
  }

  .file-count {
    font-size: 0.73rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  .img-previews {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.5rem 0 0.25rem;
  }

  .img-thumb {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .img-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .img-remove {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 18px;
    height: 18px;
    border-radius: 99px;
    background: rgba(0,0,0,0.65);
    border: none;
    color: #fff;
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.1s;
  }

  .img-remove:hover { background: rgba(220,38,38,0.85); }

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
