import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'

export type RootType<T = unknown> = {
  render(children: ReactNode, context?: T): void
  unmount(): void
  output: string
  /**
   * @deprecated
   * Use Files instead
   * File will include all sources combined
   */
  file?: KubbFile.File
  files: KubbFile.File[]
}
