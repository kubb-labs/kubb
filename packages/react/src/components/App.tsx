import { Component } from 'react'

import { AppContext } from './AppContext.tsx'

import type { ReactNode } from 'react'

type Props<Meta extends Record<string, unknown> = Record<string, unknown>> = {
  onError: (error: Error) => void
  meta: Meta
  children?: ReactNode
}

class ErrorBoundary extends Component<{ onError: Props['onError']; children: ReactNode }> {
  state = { hasError: false }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function App<Meta extends Record<string, unknown> = Record<string, unknown>>({ onError, meta, children }: Props<Meta>): ReactNode {
  return (
    <ErrorBoundary onError={onError}>
      <AppContext.Provider value={{ meta }}>{children}</AppContext.Provider>
    </ErrorBoundary>
  )
}
