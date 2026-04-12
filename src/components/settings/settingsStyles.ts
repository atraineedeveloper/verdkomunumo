export const settingsStyles = `
  .page-title { font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin: 0 0 1.5rem; }
  .section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .section-title { font-size: 1rem; font-weight: 600; color: var(--color-text); margin: 0 0 1.25rem; }
  .section-copy { margin: -0.5rem 0 1rem; color: var(--color-text-muted); font-size: 0.88rem; line-height: 1.55; }
  .section-note { margin: -0.1rem 0 1rem; padding: 0.85rem 1rem; border-radius: 0.85rem; border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border)); background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)); color: var(--color-text); font-size: 0.87rem; line-height: 1.5; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; flex: 1; }
  .avatar-field { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
  .avatar-wrap { position: relative; width: 80px; height: 80px; border-radius: 9999px; cursor: pointer; flex-shrink: 0; display: block; }
  .avatar-wrap input { display: none; }
  .avatar-preview { width: 80px; height: 80px; border-radius: 9999px; object-fit: cover; border: 2px solid var(--color-border); background: var(--color-surface-alt); display: block; transition: filter 0.15s; }
  .avatar-overlay { position: absolute; inset: 0; border-radius: 9999px; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: #fff; font-size: 0.65rem; font-weight: 600; opacity: 0; transition: opacity 0.15s; }
  .avatar-wrap:hover .avatar-overlay { opacity: 1; }
  .avatar-wrap:hover .avatar-preview { filter: brightness(0.75); }
  .avatar-hint { display: flex; flex-direction: column; gap: 2px; }
  .avatar-name { font-size: 0.95rem; font-weight: 600; color: var(--color-text); }
  .avatar-sub { font-size: 0.8rem; color: var(--color-text-muted); }
  .field-row { display: flex; gap: 1rem; flex-wrap: wrap; }
  label { font-size: 0.875rem; font-weight: 500; color: var(--color-text); }
  input,textarea,select { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: 0.5rem; background: var(--color-bg); color: var(--color-text); font-size: 0.9rem; font-family: inherit; transition: border-color 0.15s; width: 100%; box-sizing: border-box; }
  input:focus,textarea:focus,select:focus { border-color: var(--color-primary); outline: none; }
  .btn-primary { padding: 0.5rem 1.25rem; background: var(--color-primary); color: white; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-primary:not(:disabled):hover { opacity: 0.9; }
  .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
  .theme-btn { padding: 0.75rem 1rem; border: 2px solid var(--color-border); border-radius: 0.75rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: border-color 0.15s, transform 0.1s; width: 100%; text-align: left; }
  .theme-btn:hover,.lang-btn-big:hover { transform: translateY(-1px); }
  .toggle-list { display: grid; gap: 0.9rem; margin-bottom: 1rem; }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.95rem 1rem; border: 1px solid var(--color-border); border-radius: 0.85rem; background: var(--color-bg); }
  .toggle-row-master { border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border)); background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg)); }
  .toggle-row-highlight { border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent); }
  .toggle-row-disabled { opacity: 0.7; }
  .toggle-kicker { display: inline-flex; margin-bottom: 0.35rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--color-primary); }
  .toggle-title { display: block; font-size: 0.92rem; font-weight: 600; color: var(--color-text); }
  .toggle-sub { display: block; margin-top: 0.2rem; font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.45; }
  .toggle-row input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--color-primary); flex-shrink: 0; }
  .toggle-row input[type="checkbox"]:disabled { cursor: not-allowed; opacity: 0.6; }
  .theme-green { background: #e8f5e9; color: #14532d; border-color: #1b7a4a; }
  .theme-dark { background: #1e293b; color: #4ade80; border-color: #22c55e; }
  .theme-vivid { background: #fdf4ff; color: #1e1b4b; border-color: #7c3aed; }
  .theme-minimal { background: #fafafa; color: #171717; border-color: #e5e5e5; }
  .lang-btn-big { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border: 2px solid var(--color-border); border-radius: 0.75rem; background: var(--color-bg); color: var(--color-text); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: border-color 0.15s, transform 0.1s; width: 100%; text-align: left; }
  .lang-btn-big.active { border-color: var(--color-primary); background: var(--color-primary); color: white; }
  .lang-flag { width: 28px; height: 21px; border-radius: 3px; display: block; box-shadow: 0 0 0 1px rgba(0,0,0,0.1); flex-shrink: 0; }
`
