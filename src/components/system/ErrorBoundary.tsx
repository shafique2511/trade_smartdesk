import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'
import { GlassCard } from '../ui/GlassCard'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Application error boundary caught an error.', error, info)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <GlassCard className="max-w-xl">
          <div className="flex items-start gap-4">
            <div className="rounded-lg border border-loss-500/30 bg-loss-500/10 p-3 text-loss-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The workspace hit an unexpected error. Refresh the app and try again.
              </p>
              <Button className="mt-5" onClick={() => window.location.reload()} variant="secondary">
                Refresh app
              </Button>
            </div>
          </div>
        </GlassCard>
      </main>
    )
  }
}
