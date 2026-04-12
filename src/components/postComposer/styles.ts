export const postComposerStyles = `
  .composer { position: relative; border-bottom: 1px solid var(--color-border); padding: 0.85rem 0; margin-bottom: 0.25rem; transition: background 0.12s ease, box-shadow 0.12s ease; }
  .composer.drag-active { background: color-mix(in srgb, var(--color-primary) 4%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 30%, transparent); border-radius: 1rem; }
  .composer-textarea { width: 100%; background: transparent; border: none; outline: none; resize: none; font-size: 0.9375rem; line-height: 1.6; color: var(--color-text); font-family: inherit; display: block; box-sizing: border-box; padding: 0.15rem 0; }
  .composer-textarea::placeholder { color: var(--color-text-muted); }
  .drop-hint { display: inline-flex; align-items: center; gap: 0.35rem; margin: 0.35rem 0 0.15rem; padding: 0.4rem 0.75rem; border-radius: 999px; background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-alt)); color: var(--color-primary); font-size: 0.78rem; font-weight: 600; }
  .quote-wrap { margin-bottom: 0.55rem; }
  .quote-label { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--color-primary); font-weight: 600; margin-bottom: 0.2rem; }
  .quote-clear { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 0.1rem; border-radius: 4px; display: flex; align-items: center; }
  .quote-clear:hover { color: var(--color-danger); }
  .preview-wrap { margin: 0.35rem 0 0.2rem; }
  .preview-loading { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--color-text-muted); padding: 0.5rem 0; }
  .preview-dismiss { background: none; border: none; font-size: 0.73rem; color: var(--color-text-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.1rem 0; font-family: inherit; margin-top: -0.4rem; }
  .preview-dismiss:hover { color: var(--color-danger); }
  .bar { display: flex; align-items: center; gap: 0.8rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border); margin-top: 0.55rem; animation: fadeIn 0.12s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
  .bar-main { display: flex; align-items: center; gap: 0.6rem; min-width: 0; flex: 1; flex-wrap: wrap; }
  .bar-meta { display: flex; align-items: center; gap: 0.55rem; margin-left: auto; }
  .bar-chip { display: inline-flex; align-items: center; gap: 0.45rem; min-height: 2.4rem; padding: 0.35rem 0.75rem; border: 1px solid var(--color-border); border-radius: 999px; background: color-mix(in srgb, var(--color-surface-alt) 78%, white 22%); color: var(--color-text-muted); transition: border-color 0.12s, color 0.12s, background 0.12s, box-shadow 0.12s; }
  .bar-chip:focus-within, .bar-chip:hover { border-color: color-mix(in srgb, var(--color-primary) 44%, var(--color-border)); color: var(--color-text); background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface-alt)); }
  .chip-label { font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); letter-spacing: 0.02em; text-transform: uppercase; }
  .category-chip { gap: 0.6rem; padding-right: 0.5rem; }
  .cat-select-wrap { position: relative; display: inline-flex; align-items: center; min-width: 9.5rem; max-width: 13rem; padding: 0.2rem 1.8rem 0.2rem 0.2rem; border-radius: 999px; background: color-mix(in srgb, var(--color-surface) 72%, white 28%); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 75%, transparent); }
  .cat-select { appearance: none; -webkit-appearance: none; background: transparent; border: none; color: var(--color-text); font-size: 0.84rem; font-weight: 600; font-family: inherit; padding: 0 0.2rem; cursor: pointer; min-width: 100%; width: 100%; outline: none; text-overflow: ellipsis; }
  .cat-chevron { position: absolute; right: 0.55rem; color: var(--color-text-muted); pointer-events: none; }
  .file-btn { cursor: pointer; font-size: 0.82rem; font-family: inherit; white-space: nowrap; }
  .file-btn svg { color: var(--color-primary); flex-shrink: 0; }
  .hint { font-size: 0.74rem; color: var(--color-text-muted); white-space: nowrap; }
  .img-previews { display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.5rem 0 0.25rem; }
  .img-thumb { position: relative; width: 72px; height: 72px; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border); flex-shrink: 0; }
  .img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .img-remove { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 99px; background: rgba(0,0,0,0.65); border: none; color: #fff; font-size: 0.85rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: background 0.1s; }
  .img-remove:hover { background: rgba(220,38,38,0.85); }
  .chars { font-size: 0.75rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
  .chars.warn { color: #d97706; }
  .chars.over { color: var(--color-danger); font-weight: 600; }
  .post-btn { background: linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 88%, white 12%), var(--color-primary)); color: #fff; border: none; border-radius: 999px; padding: 0.62rem 1rem; font-size: 0.825rem; font-weight: 700; cursor: pointer; transition: opacity 0.12s, transform 0.12s; font-family: inherit; box-shadow: 0 10px 18px -14px color-mix(in srgb, var(--color-primary) 60%, black 40%); display: inline-flex; align-items: center; justify-content: center; }
  .post-btn:not(:disabled):hover { opacity: 0.85; }
  .post-btn:not(:disabled):active { transform: translateY(1px); }
  .post-btn:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }
  .suggest-drop { position: absolute; left: 0; right: 0; z-index: 50; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); overflow: hidden; margin-top: 0.2rem; }
  .suggest-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.55rem 0.85rem; background: none; border: none; cursor: pointer; font-family: inherit; text-align: left; transition: background 0.1s; }
  .suggest-item:hover, .suggest-item.active { background: var(--color-primary-dim); }
  .suggest-ava { width: 22px; height: 22px; border-radius: 99px; object-fit: cover; flex-shrink: 0; }
  .suggest-name { font-size: 0.84rem; font-weight: 600; color: var(--color-text); }
  .suggest-user { font-size: 0.78rem; color: var(--color-text-muted); }
  .suggest-hash { font-size: 0.9rem; font-weight: 700; color: var(--color-primary); }
  .suggest-empty { padding: 0.55rem 0.85rem; font-size: 0.82rem; color: var(--color-text-muted); }
  @media (max-width: 720px) {
    .bar { flex-wrap: wrap; align-items: stretch; }
    .bar-main { width: 100%; }
    .bar-meta { margin-left: 0; justify-content: space-between; width: 100%; }
    .post-btn { width: 100%; }
    .hint { white-space: normal; }
  }
`
