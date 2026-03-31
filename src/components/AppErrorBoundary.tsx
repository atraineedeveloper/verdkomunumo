import { Component, type ErrorInfo, type ReactNode } from 'react'

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
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] px-5 py-8">
          <div className="max-w-[760px] mx-auto border border-[var(--color-danger)] rounded-xl bg-[var(--color-surface)] p-5">
            <h1 className="m-0 text-[1.1rem] font-bold">Eraro dum bildigo de la app</h1>
            <p className="mt-3 mb-0 text-[0.92rem] text-[var(--color-text-muted)]">
              La aŭtentigo funkciis, sed iu komponanto kraŝis dum la paĝo estis desegnita.
            </p>
            <pre className="mt-4 mb-0 overflow-x-auto whitespace-pre-wrap text-[0.82rem] leading-[1.5] bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-3">
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
