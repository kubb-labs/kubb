import type { Export, File, Import } from '@kubb/core'
import type { ReactNode } from 'react'

export type RootType<T = unknown> = {
  renderToString(children: ReactNode, context?: T): void
  unmount(): void
  /**
   * Custom for Kubb
   */
  imports: Import[]
  /**
   * Custom for Kubb
   */
  exports: Export[]
  /**
   * Custom for Kubb
   */
  file?: File
}
