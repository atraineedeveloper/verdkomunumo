<script lang="ts">
  import { onDestroy } from 'svelte'

  interface Props {
    urls: string[]
    alt?: string
  }
  let { urls, alt = '' }: Props = $props()

  const count = $derived(Math.min(urls.length, 4))
  let activeIndex = $state<number | null>(null)

  function openPreview(index: number) {
    activeIndex = index
  }

  function closePreview() {
    activeIndex = null
  }

  function previousImage() {
    if (activeIndex === null) return
    activeIndex = activeIndex === 0 ? urls.length - 1 : activeIndex - 1
  }

  function nextImage() {
    if (activeIndex === null) return
    activeIndex = activeIndex === urls.length - 1 ? 0 : activeIndex + 1
  }

  function onKeydown(event: KeyboardEvent) {
    if (activeIndex === null) return

    if (event.key === 'Escape') closePreview()
    if (event.key === 'ArrowLeft') previousImage()
    if (event.key === 'ArrowRight') nextImage()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
  }

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', onKeydown)
    }
  })
</script>

{#if count > 0}
  <div class="media c{count}">
    {#each urls.slice(0, 4) as url, i}
      <button type="button" class="img-wrap" onclick={() => openPreview(i)} aria-label={`Ver imagen ${i + 1}`}>
        <img src={url} {alt} class="img" loading="lazy" />
      </button>
    {/each}
  </div>
{/if}

{#if activeIndex !== null}
  <div
    class="lightbox"
    role="dialog"
    aria-modal="true"
    aria-label="Vista previa de imagen"
    tabindex="-1"
    onclick={(event) => {
      if (event.target === event.currentTarget) closePreview()
    }}
    onkeydown={(event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
        closePreview()
      }
    }}
  >
    <button type="button" class="lightbox-close" onclick={closePreview} aria-label="Cerrar vista previa">×</button>

    {#if urls.length > 1}
      <button type="button" class="nav prev" onclick={previousImage} aria-label="Imagen anterior">‹</button>
    {/if}

    <figure class="lightbox-figure">
      <img src={urls[activeIndex]} {alt} class="lightbox-image" />
    </figure>

    {#if urls.length > 1}
      <button type="button" class="nav next" onclick={nextImage} aria-label="Imagen siguiente">›</button>
    {/if}
  </div>
{/if}

<style>
  .media {
    display: grid;
    gap: 2px;
    border-radius: 10px;
    overflow: hidden;
    margin: 0.65rem 0 0.1rem;
    border: 1px solid var(--color-border);
  }

  /* 1 image — tall */
  .c1 { grid-template-columns: 1fr; }
  .c1 .img { height: clamp(180px, 45vw, 320px); }

  /* 2 images — side by side */
  .c2 { grid-template-columns: 1fr 1fr; }
  .c2 .img { height: clamp(120px, 28vw, 220px); }

  /* 3 images — first full width, two below */
  .c3 { grid-template-columns: 1fr 1fr; }
  .c3 .img-wrap:first-child { grid-column: 1 / -1; }
  .c3 .img-wrap:first-child .img { height: clamp(140px, 32vw, 220px); }
  .c3 .img-wrap:not(:first-child) .img { height: clamp(100px, 22vw, 160px); }

  /* 4 images — 2×2 grid */
  .c4 { grid-template-columns: 1fr 1fr; }
  .c4 .img { height: clamp(100px, 24vw, 180px); }

  .img-wrap {
    appearance: none;
    background: none;
    border: none;
    cursor: zoom-in;
    display: block;
    overflow: hidden;
    padding: 0;
    width: 100%;
  }
  .img-wrap:hover .img { opacity: 0.92; }

  .img {
    width: 100%;
    object-fit: cover;
    display: block;
    transition: opacity 0.15s;
  }

  .lightbox {
    align-items: center;
    background: rgba(5, 15, 10, 0.82);
    display: flex;
    inset: 0;
    justify-content: center;
    padding: 1.25rem;
    position: fixed;
    z-index: 1200;
  }

  .lightbox-figure {
    margin: 0;
    max-height: 100%;
    max-width: min(92vw, 1100px);
  }

  .lightbox-image {
    border-radius: 14px;
    display: block;
    max-height: 88vh;
    max-width: 100%;
    object-fit: contain;
  }

  .lightbox-close,
  .nav {
    align-items: center;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    color: white;
    cursor: pointer;
    display: inline-flex;
    font-size: 1.75rem;
    height: 44px;
    justify-content: center;
    line-height: 1;
    width: 44px;
  }

  .lightbox-close {
    position: absolute;
    right: 1rem;
    top: 1rem;
  }

  .nav {
    flex-shrink: 0;
  }

  .prev { margin-right: 0.75rem; }
  .next { margin-left: 0.75rem; }

  @media (max-width: 640px) {
    .lightbox {
      padding: 0.75rem;
    }

    .nav {
      bottom: 1rem;
      position: absolute;
    }

    .prev {
      left: 1rem;
      margin-right: 0;
    }

    .next {
      margin-left: 0;
      right: 1rem;
    }
  }
</style>
