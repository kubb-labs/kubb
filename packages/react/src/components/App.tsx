import { Component } from 'react'

import { AppContext } from './AppContext.tsx'

import type { Logger } from '@kubb/core/logger'
import type { KubbNode } from '../types.ts'

type Props<Meta extends Record<string, unknown> = Record<string, unknown>> = {
  onError: (error: Error) => void
  meta: Meta
  logger?: Logger
  children?: KubbNode
}

class ErrorBoundary extends Component<{ onError: Props['onError']; logger?: Logger; children: KubbNode }> {
  state = { hasError: false }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
    this.props.logger?.error(error?.message)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function App<Meta extends Record<string, unknown> = Record<string, unknown>>({ onError, logger, meta, children }: Props<Meta>): KubbNode {
  return (
    <ErrorBoundary logger={logger} onError={onError}>
      <AppContext.Provider value={{ meta }}>{children}</AppContext.Provider>
    </ErrorBoundary>
  )
}
