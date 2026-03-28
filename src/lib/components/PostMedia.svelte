<script lang="ts">
  interface Props {
    urls: string[]
    alt?: string
  }
  let { urls, alt = '' }: Props = $props()

  const count = $derived(Math.min(urls.length, 4))
</script>

{#if count > 0}
  <div class="media c{count}">
    {#each urls.slice(0, 4) as url, i}
      <a href={url} target="_blank" rel="noopener" class="img-wrap">
        <img src={url} {alt} class="img" loading="lazy" />
      </a>
    {/each}
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

  .img-wrap { display: block; overflow: hidden; }
  .img-wrap:hover .img { opacity: 0.92; }

  .img {
    width: 100%;
    object-fit: cover;
    display: block;
    transition: opacity 0.15s;
  }
</style>
