import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'

export type RootType<T = unknown> = {
  renderToString(children: ReactNode, context?: T): void
  unmount(): void
  /**
   * Custom for Kubb
   */
  file?: KubbFile.File
}
