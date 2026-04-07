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
   * Exit (unmount) the whole app.
   */
  onExit: (error?: Error) => void
  /**
   * Error hook receiving runtime exceptions.
   */
  onError: (error: Error) => void
  /**
   * Children nodes.
   */
  children?: KubbReactNode
}

/**
 * This component provides the root behavior for the Kubb runtime.
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
