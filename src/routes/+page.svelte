<script>
  import { PenLine, MessageCircle, BookOpen, Sprout } from 'lucide-svelte'
  import { PUBLIC_DEMO_MODE } from '$env/static/public'
  const isDemo = PUBLIC_DEMO_MODE === 'true'
</script>

<svelte:head>
  <title>Verdkomunumo — La verda komunumo de Esperantujo</title>
  <meta name="description" content="La socia reto por esperantistoj. Konektiĝu, legu, skribu kaj praktiku Esperanton." />
</svelte:head>

<div class="landing">
  <!-- Hero -->
  <section class="hero">
    <div class="hero-logo">★</div>
    <h1 class="hero-title">Verdkomunumo <span class="beta">beta</span></h1>
    <p class="hero-tagline">La verda komunumo de Esperantujo</p>
    <p class="hero-desc">
      La socia reto por esperantistoj kaj lernantoj.<br />
      Konektiĝu, diskutu, kaj praktiku la lingvon.
    </p>
    <div class="hero-actions">
      {#if isDemo}
        <a href="/feed" class="btn-primary">Esplori la demon →</a>
        <a href="/login" class="btn-outline">Ensaluti</a>
      {:else}
        <a href="/register" class="btn-primary">Registriĝi — senpaga</a>
        <a href="/login" class="btn-outline">Ensaluti</a>
      {/if}
    </div>
    {#if isDemo}
      <p class="demo-note">Versio demo — neniu konto bezonata</p>
    {/if}
  </section>

  <!-- Features -->
  <section class="features">
    <div class="feature">
      <span class="feature-icon" style="color: #7c3aed"><PenLine size={32} strokeWidth={1.5} /></span>
      <h3>Afiŝoj kaj diskutoj</h3>
      <p>Skribu en Esperanto, dividu ideojn, respondu al aliaj.</p>
    </div>
    <div class="feature">
      <span class="feature-icon" style="color: #0891b2"><MessageCircle size={32} strokeWidth={1.5} /></span>
      <h3>Mesaĝoj en reala tempo</h3>
      <p>Parolu private kun aliaj esperantistoj tra la tuta mondo.</p>
    </div>
    <div class="feature">
      <span class="feature-icon" style="color: #3b82f6"><BookOpen size={32} strokeWidth={1.5} /></span>
      <h3>Kategorioj</h3>
      <p>Kulturo, lernado, vojaĝoj, teknologio, kaj pli.</p>
    </div>
    <div class="feature">
      <span class="feature-icon" style="color: #16a34a"><Sprout size={32} strokeWidth={1.5} /></span>
      <h3>Por ĉiuj niveloj</h3>
      <p>Komencanto, progresanto aŭ flua — ĉiuj estas bonvenaj.</p>
    </div>
  </section>

  <footer class="landing-footer">
    <p>Verdkomunumo · <a href="/login">Ensaluti</a> · <a href="/register">Registriĝi</a></p>
  </footer>
</div>

<style>
  .landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--color-bg);
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 5rem 1.5rem 3rem;
    max-width: 600px;
  }

  .hero-logo {
    font-size: 4rem;
    color: var(--color-primary);
    line-height: 1;
    margin-bottom: 1rem;
  }

  .hero-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--color-primary);
    margin: 0 0 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .beta {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-primary);
    background: var(--color-primary-dim);
    border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
    padding: 0.15rem 0.5rem;
    border-radius: 99px;
    align-self: flex-start;
    margin-top: 0.5rem;
  }

  .hero-tagline {
    font-size: 1rem;
    font-style: italic;
    color: var(--color-text-muted);
    margin: 0 0 1.25rem;
  }

  .hero-desc {
    font-size: 1.05rem;
    color: var(--color-text);
    line-height: 1.7;
    margin: 0 0 2rem;
  }

  .hero-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-primary {
    padding: 0.7rem 1.75rem;
    background: var(--color-primary);
    color: white;
    border-radius: 0.6rem;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .btn-primary:hover { opacity: 0.9; }

  .btn-outline {
    padding: 0.7rem 1.75rem;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
    border-radius: 0.6rem;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.15s;
  }

  .btn-outline:hover { background: var(--color-bg); }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.25rem;
    padding: 1rem 1.5rem 4rem;
    max-width: 960px;
    width: 100%;
  }

  .feature {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    padding: 1.5rem;
  }

  .feature-icon {
    display: flex;
    align-items: center;
    color: var(--color-primary);
    margin-bottom: 0.75rem;
  }

  .feature h3 {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.4rem;
  }

  .feature p {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .landing-footer {
    margin-top: auto;
    padding: 1.5rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .landing-footer a { color: var(--color-primary); text-decoration: none; }

  .demo-note {
    font-size: 0.78rem;
    color: var(--color-text-muted);
    margin: 0.5rem 0 0;
  }
</style>
