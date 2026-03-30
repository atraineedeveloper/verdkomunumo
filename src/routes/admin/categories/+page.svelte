<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { withPendingAction } from '$lib/forms/pending'
  import { t } from '$lib/i18n'
  import { toastStore } from '$lib/stores/toasts'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  function getResultPayload(data: unknown) {
    return (data ?? {}) as {
      message?: string
    }
  }

  const handleAdminAction = withPendingAction(() => {
    return async ({ result, update }) => {
      await update()

      if (result.type === 'success') {
        toastStore.success(getResultPayload(result.data).message ?? 'Saved.')
        await invalidateAll()
        return
      }

      if (result.type === 'failure') {
        toastStore.error(getResultPayload(result.data).message ?? 'Something went wrong.')
        return
      }

      if (result.type === 'error') {
        toastStore.error('Something went wrong.')
      }
    }
  })
</script>

<svelte:head>
  <title>{$t('admin_nav_categories')} — Verdkomunumo</title>
</svelte:head>

<h1 class="page-title">{$t('admin_nav_categories')}</h1>
<p class="page-subtitle">Create, edit, reorder, hide, and safely delete categories from one place.</p>

<section class="section">
  <h2 class="section-title">New category</h2>
  <form method="POST" action="?/createCategory" class="create-form" use:enhance={handleAdminAction}>
    <div class="grid">
      <label class="field">
        <span>Name</span>
        <input type="text" name="name" required maxlength="40" />
      </label>
      <label class="field">
        <span>Slug</span>
        <input type="text" name="slug" required maxlength="40" placeholder="community-updates" />
      </label>
      <label class="field">
        <span>Color</span>
        <input type="color" name="color" value="#16a34a" required />
      </label>
      <label class="field">
        <span>Sort order</span>
        <input type="number" name="sort_order" value="0" min="0" max="999" required />
      </label>
      <label class="field">
        <span>Icon</span>
        <input type="text" name="icon" maxlength="32" placeholder="sprout" />
      </label>
      <label class="field field-wide">
        <span>Description</span>
        <input type="text" name="description" maxlength="140" required />
      </label>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn-primary">Create category</button>
    </div>
  </form>
</section>

<section class="section">
  <h2 class="section-title">Existing categories</h2>
  <div class="cards">
    {#each data.categories as category}
      <article class="card">
        <div class="card-head">
          <div>
            <div class="card-title-row">
              <span class="color-dot" style="background: {category.color}"></span>
              <h3>{category.name}</h3>
              <span class:inactive={!category.is_active} class="status-chip">
                {category.is_active ? 'Active' : 'Hidden'}
              </span>
            </div>
            <p class="card-meta">
              /{category.slug} · {category.post_count} posts · order {category.sort_order}
            </p>
          </div>
          <form method="POST" action="?/toggleCategory" use:enhance={handleAdminAction}>
            <input type="hidden" name="category_id" value={category.id} />
            <input type="hidden" name="is_active" value={category.is_active ? 'true' : 'false'} />
            <button type="submit" class="btn-secondary">
              {category.is_active ? 'Hide' : 'Activate'}
            </button>
          </form>
        </div>

        <p class="card-description">{category.description}</p>

        <details class="editor">
          <summary>Edit category</summary>
          <form method="POST" action="?/updateCategory" class="edit-form" use:enhance={handleAdminAction}>
            <input type="hidden" name="category_id" value={category.id} />
            <div class="grid">
              <label class="field">
                <span>Name</span>
                <input type="text" name="name" value={category.name} required maxlength="40" />
              </label>
              <label class="field">
                <span>Slug</span>
                <input type="text" name="slug" value={category.slug} required maxlength="40" />
              </label>
              <label class="field">
                <span>Color</span>
                <input type="color" name="color" value={category.color} required />
              </label>
              <label class="field">
                <span>Sort order</span>
                <input type="number" name="sort_order" value={category.sort_order} min="0" max="999" required />
              </label>
              <label class="field">
                <span>Icon</span>
                <input type="text" name="icon" value={category.icon} maxlength="32" />
              </label>
              <label class="field field-wide">
                <span>Description</span>
                <input type="text" name="description" value={category.description} maxlength="140" required />
              </label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Save changes</button>
            </div>
          </form>
        </details>

        <form method="POST" action="?/deleteCategory" class="danger-zone" use:enhance={handleAdminAction}>
          <input type="hidden" name="category_id" value={category.id} />
          <button type="submit" class="btn-danger" disabled={category.post_count > 0}>
            Delete category
          </button>
          {#if category.post_count > 0}
            <span class="danger-note">Only empty categories can be deleted.</span>
          {/if}
        </form>
      </article>
    {/each}
  </div>
</section>

<style>
  .page-title { font-size: 1.5rem; margin: 0 0 0.25rem; }
  .page-subtitle { color: var(--color-text-muted); margin: 0 0 1.5rem; }
  .section { margin-bottom: 2rem; }
  .section-title { font-size: 1rem; margin: 0 0 0.75rem; }

  .create-form,
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.9rem;
    padding: 1rem;
  }

  .cards {
    display: grid;
    gap: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .field span {
    font-size: 0.78rem;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .field input {
    min-height: 42px;
    border-radius: 0.75rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 0.7rem 0.8rem;
    font: inherit;
  }

  .field input[type='color'] {
    padding: 0.35rem;
  }

  .field-wide {
    grid-column: 1 / -1;
  }

  .form-actions {
    margin-top: 0.9rem;
    display: flex;
    justify-content: flex-end;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    border-radius: 0.7rem;
    padding: 0.6rem 0.9rem;
    font: inherit;
    cursor: pointer;
  }

  .btn-primary {
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: white;
  }

  .btn-secondary {
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
  }

  .btn-danger {
    border: 1px solid #dc2626;
    background: transparent;
    color: #dc2626;
  }

  .btn-danger:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }

  .card-title-row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .card-title-row h3 {
    margin: 0;
    font-size: 1rem;
  }

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
  }

  .status-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.25rem 0.55rem;
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    color: var(--color-primary);
    font-size: 0.74rem;
    font-weight: 700;
  }

  .inactive {
    background: color-mix(in srgb, #dc2626 12%, transparent);
    color: #b91c1c;
  }

  .card-meta,
  .card-description,
  .danger-note {
    color: var(--color-text-muted);
  }

  .card-meta {
    margin: 0.35rem 0 0;
    font-size: 0.84rem;
  }

  .card-description {
    margin: 0.9rem 0;
  }

  .editor {
    border-top: 1px solid var(--color-border);
    padding-top: 0.9rem;
  }

  .editor summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.85rem;
  }

  .danger-zone {
    margin-top: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  @media (max-width: 900px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }

    .card-head {
      flex-direction: column;
    }
  }
</style>
