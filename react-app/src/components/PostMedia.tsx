import { useEffect, useRef, useState } from 'react'

interface Props {
  urls: string[]
  alt?: string
}

export default function PostMedia({ urls, alt = '' }: Props) {
  const count = Math.min(urls.length, 4)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (activeIndex === null) return
      if (e.key === 'Escape') setActiveIndex(null)
      if (e.key === 'ArrowLeft') setActiveIndex(i => (i === null || i === 0) ? urls.length - 1 : i - 1)
      if (e.key === 'ArrowRight') setActiveIndex(i => (i === null || i === urls.length - 1) ? 0 : i + 1)
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [activeIndex, urls.length])

  if (count === 0) return null

  const gridClass = `media c${count}`

  return (
    <>
      <div className={gridClass}>
        {urls.slice(0, 4).map((url, i) => (
          <button
            key={i}
            type="button"
            className="img-wrap"
            onClick={() => setActiveIndex(i)}
            aria-label={`Ver imagen ${i + 1}`}
          >
            <img src={url} alt={alt} className="img" loading="lazy" />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de imagen"
          tabIndex={-1}
          onClick={e => { if (e.target === e.currentTarget) setActiveIndex(null) }}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setActiveIndex(null)}
            aria-label="Cerrar vista previa"
          >×</button>

          {urls.length > 1 && (
            <button
              type="button"
              className="nav prev"
              onClick={() => setActiveIndex(i => (i === null || i === 0) ? urls.length - 1 : i - 1)}
              aria-label="Imagen anterior"
            >‹</button>
          )}

          <figure className="lightbox-figure">
            <img src={urls[activeIndex]} alt={alt} className="lightbox-image" />
          </figure>

          {urls.length > 1 && (
            <button
              type="button"
              className="nav next"
              onClick={() => setActiveIndex(i => (i === null || i === urls.length - 1) ? 0 : i + 1)}
              aria-label="Imagen siguiente"
            >›</button>
          )}
        </div>
      )}

      <style>{`
        .media { display: grid; gap: 2px; border-radius: 10px; overflow: hidden; margin: 0.65rem 0 0.1rem; border: 1px solid var(--color-border); }
        .c1 { grid-template-columns: 1fr; }
        .c1 .img { height: clamp(180px, 45vw, 320px); }
        .c2 { grid-template-columns: 1fr 1fr; }
        .c2 .img { height: clamp(120px, 28vw, 220px); }
        .c3 { grid-template-columns: 1fr 1fr; }
        .c3 .img-wrap:first-child { grid-column: 1 / -1; }
        .c3 .img-wrap:first-child .img { height: clamp(140px, 32vw, 220px); }
        .c3 .img-wrap:not(:first-child) .img { height: clamp(100px, 22vw, 160px); }
        .c4 { grid-template-columns: 1fr 1fr; }
        .c4 .img { height: clamp(100px, 24vw, 180px); }
        .img-wrap { appearance: none; background: none; border: none; cursor: zoom-in; display: block; overflow: hidden; padding: 0; width: 100%; }
        .img-wrap:hover .img { opacity: 0.92; }
        .img { width: 100%; object-fit: cover; display: block; transition: opacity 0.15s; }
        .lightbox { align-items: center; background: rgba(5,15,10,0.82); display: flex; inset: 0; justify-content: center; padding: 1.25rem; position: fixed; z-index: 1200; }
        .lightbox-figure { margin: 0; max-height: 100%; max-width: min(92vw, 1100px); }
        .lightbox-image { border-radius: 14px; display: block; max-height: 88vh; max-width: 100%; object-fit: contain; }
        .lightbox-close, .nav { align-items: center; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 999px; color: white; cursor: pointer; display: inline-flex; font-size: 1.75rem; height: 44px; justify-content: center; line-height: 1; width: 44px; }
        .lightbox-close { position: absolute; right: 1rem; top: 1rem; }
        .nav { flex-shrink: 0; }
        .prev { margin-right: 0.75rem; }
        .next { margin-left: 0.75rem; }
        @media (max-width: 640px) {
          .lightbox { padding: 0.75rem; }
          .nav { bottom: 1rem; position: absolute; }
          .prev { left: 1rem; margin-right: 0; }
          .next { margin-left: 0; right: 1rem; }
        }
      `}</style>
    </>
  )
}
