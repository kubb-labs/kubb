import { Component, createContext } from 'react'

import type { Logger } from '@kubb/core/logger'
import type { KubbNode } from '../types.ts'

type Props<Meta extends Record<string, unknown> = Record<string, unknown>> = {
  onError: (error: Error) => void
  meta: Meta
  logger?: Logger
  children?: KubbNode
}

class ErrorBoundary extends Component<{
  onError: Props['onError']
  logger?: Logger
  children: KubbNode
}> {
  state = { hasError: false }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    if (error) {
      this.props.onError(error)
      this.props.logger?.emit('error', error.message, error)
    }
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export type AppContextProps<Meta extends Record<string, unknown> = Record<string, unknown>> = {
  meta: Meta
}

const AppContext = createContext<AppContextProps>({
  meta: {},
})

export function App<Meta extends Record<string, unknown> = Record<string, unknown>>({ onError, logger, meta, children }: Props<Meta>): KubbNode {
  return (
    <ErrorBoundary logger={logger} onError={onError}>
      <AppContext.Provider value={{ meta }}>{children}</AppContext.Provider>
    </ErrorBoundary>
  )
}

App.Context = AppContext
