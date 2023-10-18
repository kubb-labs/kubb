import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'

export type RootType<T = unknown> = {
  render(children: ReactNode, context?: T): void
  unmount(): void
  output: string
  /**
   * Custom for Kubb
   */
  file?: KubbFile.File
}
