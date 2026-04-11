import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureAppException } from '@/lib/monitoring'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render failed', error, errorInfo)
    captureAppException(error, { componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[var(--color-bg)] px-5 py-8 text-[var(--color-text)]">
          <div className="mx-auto max-w-[760px] rounded-xl border border-[var(--color-danger)] bg-[var(--color-surface)] p-5">
            <h1 className="m-0 text-[1.1rem] font-bold">Eraro dum bildigo de la app</h1>
            <p className="mt-3 mb-0 text-[0.92rem] text-[var(--color-text-muted)]">
              La aŭtentigo funkciis, sed iu komponanto kraŝis dum la paĝo estis desegnita.
            </p>
            <pre className="mt-4 mb-0 overflow-x-auto whitespace-pre-wrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 text-[0.82rem] leading-[1.5]">
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
