<script lang="ts">
  import { Lightbulb, Send, X } from 'lucide-svelte'
  import { t } from '$lib/i18n'
  import { toastStore } from '$lib/stores/toasts'

  let open = $state(false)
  let submitting = $state(false)
  let title = $state('')
  let description = $state('')
  let context = $state('')
  let errors = $state<Record<string, string[] | undefined>>({})

  function resetForm() {
    title = ''
    description = ''
    context = ''
    errors = {}
  }

  async function submitSuggestion(event: SubmitEvent) {
    event.preventDefault()
    if (submitting) return

    submitting = true
    errors = {}

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          context
        })
      })

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; errors?: Record<string, string[] | undefined> }
        | null

      if (!response.ok) {
        errors = payload?.errors ?? {}
        toastStore.error(payload?.message ?? $t('suggestion_error'))
        return
      }

      toastStore.success(payload?.message ?? $t('suggestion_success'))
      open = false
      resetForm()
    } catch {
      toastStore.error($t('toast_action_failed'))
    } finally {
      submitting = false
    }
  }
</script>

<svelte:window onkeydown={(event) => {
  if (event.key === 'Escape') open = false
}} />

<button
  type="button"
  class="fab"
  aria-haspopup="dialog"
  aria-expanded={open}
  onclick={() => (open = true)}
>
  <Lightbulb size={18} strokeWidth={1.9} />
  <span>{$t('suggestion_fab')}</span>
</button>

{#if open}
  <div
    class="backdrop"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) open = false
    }}
  >
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="suggestion-title">
      <div class="sheet-head">
        <div>
          <p class="eyebrow">Verdkomunumo</p>
          <h2 id="suggestion-title">{$t('suggestion_title')}</h2>
          <p class="subtitle">{$t('suggestion_subtitle')}</p>
        </div>
        <button type="button" class="ghost" aria-label="Close suggestion form" onclick={() => (open = false)}>
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <form class="sheet-form" onsubmit={submitSuggestion}>
        <label>
          <span>{$t('suggestion_name')}</span>
          <input bind:value={title} maxlength="80" required />
          {#if errors.title}
            <small>{errors.title[0]}</small>
          {/if}
        </label>

        <label>
          <span>{$t('suggestion_description')}</span>
          <textarea bind:value={description} rows="4" maxlength="200" required></textarea>
          {#if errors.description}
            <small>{errors.description[0]}</small>
          {/if}
        </label>

        <label>
          <span>{$t('suggestion_reason')}</span>
          <textarea bind:value={context} rows="4" maxlength="500"></textarea>
          {#if errors.context}
            <small>{errors.context[0]}</small>
          {/if}
        </label>

        <div class="sheet-actions">
          <button type="button" class="btn-muted" onclick={() => (open = false)}>
            {$t('suggestion_cancel')}
          </button>
          <button type="submit" class="btn-primary" disabled={submitting}>
            <Send size={16} strokeWidth={1.9} />
            <span>{submitting ? $t('suggestion_submitting') : $t('suggestion_submit')}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .fab {
    position: fixed;
    right: 1rem;
    bottom: 5.3rem;
    z-index: 950;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    border: none;
    border-radius: 999px;
    padding: 0.9rem 1.1rem;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.32), transparent 45%),
      linear-gradient(135deg, #138548 0%, #0f6a3c 100%);
    color: white;
    font: inherit;
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    box-shadow: 0 20px 35px rgba(11, 88, 52, 0.26);
    cursor: pointer;
  }

  .fab:hover {
    transform: translateY(-1px);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1050;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
    background: rgba(7, 19, 13, 0.42);
    backdrop-filter: blur(8px);
  }

  .sheet {
    width: min(34rem, 100%);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.96)),
      var(--color-surface);
    border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
    border-radius: 1.5rem;
    padding: 1.15rem;
    box-shadow: 0 28px 60px rgba(0, 0, 0, 0.22);
  }

  .sheet-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.2rem;
    color: var(--color-primary);
    font-size: 0.74rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  h2 {
    margin: 0;
    font-size: 1.15rem;
    color: var(--color-text);
  }

  .subtitle {
    margin: 0.35rem 0 0;
    color: var(--color-text-muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .ghost {
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 999px;
    display: grid;
    place-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .sheet-form {
    display: grid;
    gap: 0.95rem;
  }

  label {
    display: grid;
    gap: 0.4rem;
  }

  label span {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--color-text);
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border-radius: 0.95rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 0.82rem 0.92rem;
    font: inherit;
    resize: vertical;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
  }

  small {
    color: #b91c1c;
    font-size: 0.8rem;
  }

  .sheet-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }

  .btn-muted,
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border-radius: 999px;
    padding: 0.75rem 1rem;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-muted {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
  }

  .btn-primary {
    border: none;
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  @media (min-width: 768px) {
    .fab {
      right: 1.5rem;
      bottom: 1.5rem;
    }

    .backdrop {
      align-items: center;
    }

    .sheet {
      padding: 1.35rem;
    }
  }
</style>
