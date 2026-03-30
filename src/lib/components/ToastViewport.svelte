<script lang="ts">
  import { fly, fade } from 'svelte/transition'
  import { toastStore } from '$lib/stores/toasts'
</script>

<div class="toast-viewport" aria-live="polite" aria-atomic="true">
  {#each $toastStore as toast (toast.id)}
    <div
      class="toast {toast.tone}"
      role={toast.tone === 'error' ? 'alert' : 'status'}
      in:fly={{ y: 16, duration: 180 }}
      out:fade={{ duration: 160 }}
    >
      <p>{toast.message}</p>
      <button
        type="button"
        class="close"
        aria-label="Dismiss notification"
        onclick={() => toastStore.remove(toast.id)}
      >
        ×
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-viewport {
    position: fixed;
    right: 1rem;
    bottom: 5.25rem;
    z-index: 1200;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    width: min(24rem, calc(100vw - 1.5rem));
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.85rem 0.95rem;
    border-radius: 1rem;
    border: 1px solid var(--color-border);
    background: color-mix(in srgb, var(--color-surface) 92%, white 8%);
    color: var(--color-text);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.14);
    pointer-events: auto;
    backdrop-filter: blur(14px);
  }

  .toast.success {
    border-color: color-mix(in srgb, var(--color-primary) 36%, transparent);
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface) 90%);
  }

  .toast.error {
    border-color: rgba(220, 38, 38, 0.28);
    background: #fff5f5;
    color: #7f1d1d;
  }

  .toast.info {
    border-color: color-mix(in srgb, var(--color-primary) 24%, transparent);
  }

  p {
    margin: 0;
    flex: 1;
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .close {
    border: none;
    background: transparent;
    color: inherit;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.05rem;
    opacity: 0.72;
  }

  .close:hover {
    opacity: 1;
  }

  @media (min-width: 768px) {
    .toast-viewport {
      bottom: 1.25rem;
    }
  }
</style>
