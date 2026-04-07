import { Component } from 'react'
import type { KubbReactElement, KubbReactNode } from '../types.ts'

type ErrorBoundaryProps = {
  onError: (error: Error) => void
  children?: KubbReactNode
}

class ErrorBoundary extends Component<{
  onError: ErrorBoundaryProps['onError']
  children?: KubbReactNode
}> {
  state = { hasError: false }

  static displayName = 'ErrorBoundary'
  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    if (error) {
      this.props.onError(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export type RootProps = {
  /**
   * Callback invoked to unmount the entire renderer tree.
   * Called with an `Error` when the exit is caused by a render error,
   * or with `undefined` for a clean shutdown.
   */
  onExit: (error?: Error) => void
  /**
   * Callback invoked whenever a render error is caught by the error boundary.
   * Use this to propagate errors up to the caller of {@link createRenderer}.
   */
  onError: (error: Error) => void
  /**
   * Child nodes rendered inside the error boundary.
   */
  children?: KubbReactNode
}

/**
 * Root component for the Kubb renderer tree.
 *
 * Wraps all children in an `ErrorBoundary` so that render errors are caught
 * and forwarded to `onError` rather than crashing the process.
 */
export function Root({ onError, children }: RootProps): KubbReactElement {
  return (
    <ErrorBoundary
      onError={(error) => {
        onError(error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

Root.displayName = 'Root'
