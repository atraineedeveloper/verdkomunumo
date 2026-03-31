import { Navigate, Link } from 'react-router-dom'
import { BookOpen, MessageCircle, PenLine, Sprout } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { routes } from '@/lib/routes'
import { useAuthStore } from '@/stores/auth'

const features = [
  {
    icon: PenLine,
    color: '#7c3aed',
    title: 'Afisxoj kaj diskutoj',
    description: 'Skribu en Esperanto, dividu ideojn, respondu al aliaj.',
  },
  {
    icon: MessageCircle,
    color: '#0891b2',
    title: 'Mesagxoj en reala tempo',
    description: 'Parolu private kun aliaj esperantistoj tra la tuta mondo.',
  },
  {
    icon: BookOpen,
    color: '#3b82f6',
    title: 'Kategorioj',
    description: 'Kulturo, lernado, vojagxoj, teknologio, kaj pli.',
  },
  {
    icon: Sprout,
    color: '#16a34a',
    title: 'Por cxiuj niveloj',
    description: 'Komencanto, progresanto aux flua - cxiuj estas bonvenaj.',
  },
] as const

export default function LandingPage() {
  const { user, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={routes.feed} replace />
  }

  return (
    <>
      <Helmet>
        <title>Verdkomunumo — La verda komunumo de Esperantujo</title>
        <meta
          name="description"
          content="La socia reto por esperantistoj. Konektigxu, legu, skribu kaj praktiku Esperanton."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center bg-[var(--color-bg)]">
        <section className="max-w-[600px] px-6 pt-20 pb-12 text-center flex flex-col items-center">
          <div className="mb-4 text-[4rem] leading-none text-[var(--color-primary)]">★</div>
          <h1 className="mb-2 flex items-center gap-2 text-[2.5rem] font-extrabold text-[var(--color-primary)]">
            <span>Verdkomunumo</span>
            <span className="self-start mt-2 rounded-full border border-[color:color-mix(in_srgb,var(--color-primary)_25%,transparent)] bg-[var(--color-primary-dim)] px-2 py-[0.15rem] text-xs font-bold uppercase tracking-[0.05em] text-[var(--color-primary)]">
              beta
            </span>
          </h1>
          <p className="mb-5 text-base italic text-[var(--color-text-muted)]">
            La verda komunumo de Esperantujo
          </p>
          <p className="mb-8 text-[1.05rem] leading-[1.7] text-[var(--color-text)]">
            La socia reto por esperantistoj kaj lernantoj.
            <br />
            Konektigxu, diskutu, kaj praktiku la lingvon.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={routes.register}
              className="rounded-[0.6rem] bg-[var(--color-primary)] px-7 py-[0.7rem] text-base font-semibold text-white no-underline transition-opacity hover:opacity-90"
            >
              Registrigxi - senpaga
            </Link>
            <Link
              to={routes.login}
              className="rounded-[0.6rem] border-2 border-[var(--color-primary)] px-7 py-[0.7rem] text-base font-semibold text-[var(--color-primary)] no-underline transition-colors hover:bg-[var(--color-bg)]"
            >
              Ensaluti
            </Link>
          </div>
        </section>

        <section className="grid w-full max-w-[960px] grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5 px-6 pb-16 pt-4">
          {features.map(({ icon: Icon, color, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            >
              <span className="mb-3 flex items-center" style={{ color }}>
                <Icon size={32} strokeWidth={1.5} />
              </span>
              <h3 className="mb-1.5 text-[0.95rem] font-semibold text-[var(--color-text)]">{title}</h3>
              <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
            </div>
          ))}
        </section>

        <footer className="mt-auto p-6 text-center text-[0.8rem] text-[var(--color-text-muted)]">
          <p>
            Verdkomunumo ·{' '}
            <Link to={routes.login} className="text-[var(--color-primary)] no-underline">
              Ensaluti
            </Link>{' '}
            ·{' '}
            <Link to={routes.register} className="text-[var(--color-primary)] no-underline">
              Registrigxi
            </Link>
          </p>
        </footer>
      </div>
    </>
  )
}
